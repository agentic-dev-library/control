#!/usr/bin/env node

/**
 * Ecosystem Curator
 * 
 * Nightly autonomous orchestration using @agentic/control for:
 * - Cursor Cloud Agent management (via CursorAPI)
 * - Issue triage
 * - PR processing
 * 
 * @see https://github.com/jbcom/nodejs-agentic-control
 */

import { writeFile } from 'fs/promises';

// Environment
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CURSOR_API_KEY = process.env.CURSOR_API_KEY;
const GOOGLE_JULES_API_KEY = process.env.GOOGLE_JULES_API_KEY;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'https://ollama.com';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

const ORGANIZATIONS = ['jbcom', 'strata-game-library', 'agentic-dev-library', 'extended-data-library'];
const DRY_RUN = process.env.DRY_RUN === 'true';
const TARGET_ORG = process.env.TARGET_ORG;
const TARGET_REPO = process.env.TARGET_REPO;

// Stats
const stats = {
  repos_scanned: 0,
  issues_triaged: 0,
  prs_processed: 0,
  jules_sessions_created: 0,
  cursor_agents_spawned: 0,
  ollama_resolutions: 0,
  merged_prs: 0,
  dry_run: DRY_RUN,
  errors: []
};

// ============================================
// Dynamic imports for @agentic/control
// ============================================
let CursorAPI = null;

async function loadAgenticControl() {
  try {
    const fleet = await import('@agentic/control/fleet');
    CursorAPI = fleet.CursorAPI;
    console.log('✅ Loaded @agentic/control/fleet');
    return true;
  } catch (e) {
    console.warn(`⚠️  @agentic/control not available: ${e.message}`);
    console.warn('   Falling back to direct API calls');
    return false;
  }
}

// ============================================
// Cursor API (fallback if @agentic/control not available)
// ============================================
const CURSOR_BASE_URL = 'https://api.cursor.com/v0';

async function cursorRequest(endpoint, method = 'GET', body = null) {
  if (!CURSOR_API_KEY) throw new Error('CURSOR_API_KEY not set');
  if (DRY_RUN && method !== 'GET') {
    console.log(`    [DRY RUN] Cursor: ${method} ${endpoint}`);
    return { id: 'dry-run', state: 'pending' };
  }
  
  const res = await fetch(`${CURSOR_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${CURSOR_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`Cursor API ${res.status}: ${JSON.stringify(error)}`);
  }
  
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ============================================
// GitHub API
// ============================================
async function ghApi(endpoint, options = {}) {
  if (DRY_RUN && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
    console.log(`    [DRY RUN] GitHub: ${options.method} ${endpoint}`);
    return { dry_run: true };
  }

  const url = `https://api.github.com${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      ...options.headers
    }
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`GitHub API ${res.status}: ${JSON.stringify(error)}`);
  }
  
  return res.json();
}

// ============================================
// Jules API
// ============================================
async function julesApi(endpoint, options = {}) {
  if (!GOOGLE_JULES_API_KEY) throw new Error('GOOGLE_JULES_API_KEY not set');
  if (DRY_RUN && options.method === 'POST') {
    console.log(`    [DRY RUN] Jules: POST ${endpoint}`);
    return { name: 'sessions/dry-run' };
  }
  
  const res = await fetch(`https://jules.googleapis.com/v1alpha${endpoint}`, {
    ...options,
    headers: {
      'X-Goog-Api-Key': GOOGLE_JULES_API_KEY,
      'Content-Type': 'application/json',
    }
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`Jules API ${res.status}: ${JSON.stringify(error)}`);
  }
  
  return res.json();
}

// ============================================
// Ollama API  
// ============================================
async function ollamaChat(messages) {
  if (DRY_RUN) {
    console.log(`    [DRY RUN] Ollama chat`);
    return { message: { content: 'Dry run response' } };
  }
  
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OLLAMA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'glm-4.6:cloud',
      messages,
      stream: false
    })
  });
  
  if (!res.ok) throw new Error(`Ollama API ${res.status}`);
  return res.json();
}

// ============================================
// Agent Management
// ============================================
let cursorApi = null;

async function initCursor() {
  if (!CURSOR_API_KEY) {
    console.warn('⚠️  CURSOR_API_KEY not set - Cursor agents disabled');
    return false;
  }
  
  if (CursorAPI) {
    try {
      cursorApi = new CursorAPI({ apiKey: CURSOR_API_KEY });
      console.log('✅ Initialized CursorAPI from @agentic/control');
      return true;
    } catch (e) {
      console.warn(`⚠️  CursorAPI init failed: ${e.message}`);
    }
  }
  
  console.log('ℹ️  Using direct Cursor API calls');
  return true;
}

async function spawnCursorAgent(repository, task, options = {}) {
  if (cursorApi) {
    const result = await cursorApi.launchAgent({
      prompt: { text: task },
      source: { repository, ref: options.ref },
      target: {
        autoCreatePr: options.autoCreatePr ?? true,
        branchName: options.branchName,
        openAsCursorGithubApp: true,
      }
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  }
  
  // Fallback to direct API
  return cursorRequest('/agents', 'POST', {
    prompt: { text: task },
    source: { repository, ref: options.ref },
    target: {
      autoCreatePr: options.autoCreatePr ?? true,
      branchName: options.branchName,
      openAsCursorGithubApp: true,
    }
  });
}

async function listCursorAgents() {
  if (cursorApi) {
    const result = await cursorApi.listAgents();
    return result.success ? result.data : [];
  }
  const data = await cursorRequest('/agents');
  return data?.agents || [];
}

// ============================================
// Core Logic
// ============================================
async function discoverRepos() {
  const orgs = TARGET_ORG ? [TARGET_ORG] : ORGANIZATIONS;
  console.log(`🔍 Discovering repos in: ${orgs.join(', ')}`);
  
  if (TARGET_REPO) {
    for (const org of orgs) {
      try {
        return [await ghApi(`/repos/${org}/${TARGET_REPO}`)];
      } catch {}
    }
    return [];
  }
  
  let repos = [];
  for (const org of orgs) {
    try {
      const orgRepos = await ghApi(`/orgs/${org}/repos?per_page=100`);
      repos = repos.concat(orgRepos.filter(r => !r.archived));
      console.log(`   ${org}: ${orgRepos.filter(r => !r.archived).length} repos`);
    } catch (e) {
      stats.errors.push(`${org}: ${e.message}`);
    }
  }
  return repos;
}

async function triageIssue(repo, issue) {
  console.log(`  📋 Issue #${issue.number}: ${issue.title.substring(0, 50)}`);
  
  const labels = issue.labels.map(l => l.name.toLowerCase());
  const isComplex = labels.includes('complex') || labels.includes('epic') || (issue.body?.length || 0) > 1000;
  const isQuestion = labels.includes('question') || issue.title.endsWith('?');
  
  if (isQuestion && OLLAMA_API_KEY) {
    try {
      const response = await ollamaChat([
        { role: 'system', content: 'You are a helpful maintainer. Answer concisely.' },
        { role: 'user', content: `Issue: ${issue.title}\n\n${issue.body}` }
      ]);
      await ghApi(`/repos/${repo.full_name}/issues/${issue.number}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: `🤖 **Curator Response:**\n\n${response.message.content}` })
      });
      stats.ollama_resolutions++;
    } catch (e) {
      console.error(`     Ollama error: ${e.message}`);
    }
  } else if (isComplex && GOOGLE_JULES_API_KEY) {
    try {
      await julesApi('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `Fix issue #${issue.number}: ${issue.title}\n\n${issue.body}`,
          sourceContext: {
            source: `sources/github/${repo.full_name}`,
            githubRepoContext: { startingBranch: repo.default_branch }
          },
          automationMode: 'AUTO_CREATE_PR'
        })
      });
      stats.jules_sessions_created++;
      console.log('     → Jules session created');
    } catch (e) {
      console.error(`     Jules error: ${e.message}`);
      stats.errors.push(`Jules: ${e.message}`);
    }
  } else if (CURSOR_API_KEY) {
    try {
      await spawnCursorAgent(repo.full_name, `Fix issue #${issue.number}: ${issue.title}\n\n${issue.body || ''}`, {
        ref: repo.default_branch,
        branchName: `fix/issue-${issue.number}`
      });
      stats.cursor_agents_spawned++;
      console.log('     → Cursor agent spawned');
    } catch (e) {
      console.error(`     Cursor error: ${e.message}`);
      stats.errors.push(`Cursor: ${e.message}`);
    }
  }
  
  stats.issues_triaged++;
}

async function processPR(repo, pr) {
  console.log(`  🔀 PR #${pr.number}: ${pr.title.substring(0, 50)}`);
  
  const [checks, reviews] = await Promise.all([
    ghApi(`/repos/${repo.full_name}/commits/${pr.head.sha}/check-runs`),
    ghApi(`/repos/${repo.full_name}/pulls/${pr.number}/reviews`)
  ]);
  
  const allPass = checks.check_runs?.every(c => 
    c.status === 'completed' && ['success', 'neutral', 'skipped'].includes(c.conclusion)
  );
  const hasFailure = checks.check_runs?.some(c => c.conclusion === 'failure');
  const isApproved = reviews.some(r => r.state === 'APPROVED');
  const hasChangesRequested = reviews.some(r => r.state === 'CHANGES_REQUESTED');
  
  if (hasFailure && CURSOR_API_KEY) {
    try {
      await spawnCursorAgent(repo.full_name, `Fix CI in PR #${pr.number}: ${pr.title}`, {
        ref: pr.head.ref,
        autoCreatePr: false
      });
      stats.cursor_agents_spawned++;
      console.log('     → Cursor agent fixing CI');
    } catch (e) {
      console.error(`     Cursor error: ${e.message}`);
    }
  } else if (allPass && isApproved && !hasChangesRequested && pr.mergeable_state === 'clean') {
    try {
      await ghApi(`/repos/${repo.full_name}/pulls/${pr.number}/merge`, {
        method: 'PUT',
        body: JSON.stringify({ merge_method: 'squash' })
      });
      stats.merged_prs++;
      console.log('     → Merged!');
    } catch (e) {
      console.error(`     Merge error: ${e.message}`);
    }
  }
  
  stats.prs_processed++;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    ECOSYSTEM CURATOR                              ║');
  console.log('║              Powered by @agentic/control                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Target: ${TARGET_ORG || 'all orgs'} / ${TARGET_REPO || 'all repos'}\n`);
  
  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN required');
    process.exit(1);
  }
  
  // Load @agentic/control if available
  await loadAgenticControl();
  await initCursor();
  
  const repos = await discoverRepos();
  stats.repos_scanned = repos.length;
  
  for (const repo of repos) {
    console.log(`\n📦 ${repo.full_name}`);
    
    try {
      // Process issues
      const issues = await ghApi(`/repos/${repo.full_name}/issues?state=open&per_page=50`);
      for (const issue of issues.filter(i => !i.pull_request && !i.assignee)) {
        await triageIssue(repo, issue);
      }
      
      // Process PRs
      const prs = await ghApi(`/repos/${repo.full_name}/pulls?state=open&per_page=50`);
      for (const pr of prs) {
        await processPR(repo, pr);
      }
    } catch (e) {
      console.error(`   Error: ${e.message}`);
      stats.errors.push(`${repo.full_name}: ${e.message}`);
    }
  }
  
  // Fleet status
  if (CURSOR_API_KEY) {
    try {
      const agents = await listCursorAgents();
      console.log(`\n🤖 Cursor Fleet: ${agents.length} agents`);
    } catch {}
  }
  
  // Report
  await writeFile('curator-report.json', JSON.stringify(stats, null, 2));
  console.log('\n' + JSON.stringify(stats, null, 2));
  console.log('\n✅ Curator complete');
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
