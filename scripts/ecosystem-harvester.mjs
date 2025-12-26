#!/usr/bin/env node
/**
 * Ecosystem Harvester
 * 
 * Runs every 15 minutes to:
 * 1. Check Cursor Background Composers → process completed work
 * 2. Check completed Jules sessions → process their PRs
 * 3. Find PRs ready to merge → merge them
 * 4. Request reviews on PRs needing attention
 * 
 * Uses:
 * - Cursor Background Composer API (https://cursor.com)
 * - Google Jules API (https://jules.googleapis.com)
 */

import { writeFileSync } from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CURSOR_SESSION_TOKEN = process.env.CURSOR_SESSION_TOKEN;
const GOOGLE_JULES_API_KEY = process.env.GOOGLE_JULES_API_KEY;
const DRY_RUN = process.env.DRY_RUN === 'true';

// Managed organizations
const ORGANIZATIONS = ['jbcom', 'strata-game-library', 'agentic-dev-library', 'extended-data-library'];

const stats = {
  cursor_composers_checked: 0,
  cursor_composers_completed: 0,
  jules_sessions_checked: 0,
  jules_sessions_completed: 0,
  prs_reviewed: 0,
  prs_merged: 0,
  reviews_requested: 0,
  errors: []
};

// ============================================================================
// GitHub API
// ============================================================================

async function ghApi(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`GitHub API ${res.status}: ${JSON.stringify(error)}`);
  }
  return res.json();
}

// ============================================================================
// Cursor Background Composer API
// Based on: https://github.com/mjdierkes/cursor-background-agent-api
// ============================================================================

function getCursorHeaders() {
  if (!CURSOR_SESSION_TOKEN) return null;
  return {
    'Accept': '*/*',
    'Content-Type': 'application/json',
    'Cookie': `WorkosCursorSessionToken=${CURSOR_SESSION_TOKEN}`,
    'Origin': 'https://cursor.com',
    'Referer': 'https://cursor.com/agents',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
  };
}

async function cursorListComposers(n = 100) {
  const headers = getCursorHeaders();
  if (!headers) return [];
  
  const res = await fetch('https://cursor.com/api/background-composer/list', {
    method: 'POST',
    headers,
    body: JSON.stringify({ n, include_status: true })
  });
  
  if (!res.ok) {
    throw new Error(`Cursor API ${res.status}: ${await res.text()}`);
  }
  
  return res.json();
}

async function cursorGetDetailed(bcId) {
  const headers = getCursorHeaders();
  if (!headers) return null;
  
  const res = await fetch('https://cursor.com/api/background-composer/get-detailed-composer', {
    method: 'POST',
    headers,
    body: JSON.stringify({ bcId, n: 1, includeDiff: true, includeTeamWide: true })
  });
  
  if (!res.ok) {
    throw new Error(`Cursor API ${res.status}: ${await res.text()}`);
  }
  
  return res.json();
}

async function cursorOpenPr(bcId) {
  const headers = getCursorHeaders();
  if (!headers) return null;
  
  const res = await fetch('https://cursor.com/api/background-composer/open-pr', {
    method: 'POST',
    headers,
    body: JSON.stringify({ bcId })
  });
  
  if (!res.ok) {
    throw new Error(`Cursor API ${res.status}: ${await res.text()}`);
  }
  
  return res.json();
}

// ============================================================================
// Jules API
// ============================================================================

async function julesApi(endpoint, options = {}) {
  if (!GOOGLE_JULES_API_KEY) return null;
  const res = await fetch(`https://jules.googleapis.com/v1alpha${endpoint}`, {
    ...options,
    headers: {
      'X-Goog-Api-Key': GOOGLE_JULES_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`Jules API ${res.status}: ${JSON.stringify(error)}`);
  }
  return res.json();
}

// ============================================================================
// Cursor Composer Harvesting
// ============================================================================

async function harvestCursorComposers() {
  console.log('\n🤖 Harvesting Cursor Background Composers...');
  
  if (!CURSOR_SESSION_TOKEN) {
    console.log('   ⚠️ CURSOR_SESSION_TOKEN not set - skipping');
    return;
  }
  
  try {
    const composers = await cursorListComposers(100);
    stats.cursor_composers_checked = Array.isArray(composers) ? composers.length : 0;
    console.log(`   Found ${stats.cursor_composers_checked} composers`);
    
    for (const composer of (composers || [])) {
      const status = composer.status || composer.state || 'unknown';
      console.log(`   - ${composer.bcId || composer.id}: ${status}`);
      
      // Check if completed and needs PR
      if (status === 'completed' || status === 'finished' || status === 'done') {
        stats.cursor_composers_completed++;
        
        // Try to get detailed info
        try {
          const details = await cursorGetDetailed(composer.bcId || composer.id);
          
          // If there are changes but no PR, open one
          if (details?.hasChanges && !details?.prUrl && !DRY_RUN) {
            console.log(`     -> Opening PR for completed composer`);
            await cursorOpenPr(composer.bcId || composer.id);
          }
        } catch (e) {
          console.log(`     Error getting details: ${e.message}`);
        }
      }
    }
  } catch (e) {
    console.log(`   Error: ${e.message}`);
    stats.errors.push(`Cursor harvest error: ${e.message}`);
  }
}

// ============================================================================
// Jules Session Harvesting
// ============================================================================

async function harvestJulesSessions() {
  console.log('\n📝 Harvesting Jules Sessions...');
  
  if (!GOOGLE_JULES_API_KEY) {
    console.log('   ⚠️ GOOGLE_JULES_API_KEY not set - skipping');
    return;
  }
  
  try {
    const sessionsData = await julesApi('/sessions');
    const sessions = sessionsData?.sessions || [];
    stats.jules_sessions_checked = sessions.length;
    console.log(`   Found ${sessions.length} sessions`);
    
    for (const session of sessions) {
      const sessionId = session.name?.split('/').pop();
      const state = session.state || 'unknown';
      console.log(`   - ${sessionId}: ${state}`);
      
      if (state === 'COMPLETED' || state === 'PR_CREATED') {
        stats.jules_sessions_completed++;
      } else if (state === 'PROPOSED_PLAN' && !DRY_RUN) {
        console.log(`     -> Auto-approving plan`);
        try {
          await julesApi(`/sessions/${sessionId}:approvePlan`, { method: 'POST' });
        } catch (e) {
          console.log(`     Error approving: ${e.message}`);
        }
      }
    }
  } catch (e) {
    console.log(`   Error: ${e.message}`);
    stats.errors.push(`Jules harvest error: ${e.message}`);
  }
}

// ============================================================================
// PR Processing
// ============================================================================

async function processPRs() {
  console.log('\n📋 Processing Open PRs...');
  
  for (const org of ORGANIZATIONS) {
    console.log(`   Scanning ${org}...`);
    try {
      const repos = await ghApi(`/orgs/${org}/repos?per_page=100`);
      
      for (const repo of repos.filter(r => !r.archived)) {
        const prs = await ghApi(`/repos/${org}/${repo.name}/pulls?state=open&per_page=50`);
        
        for (const pr of prs) {
          await processPR(org, repo.name, pr);
        }
      }
    } catch (e) {
      console.log(`   Error listing PRs for ${org}: ${e.message}`);
      stats.errors.push(`PR list error for ${org}: ${e.message}`);
    }
  }
}

async function processPR(owner, repo, pr) {
  stats.prs_reviewed++;
  console.log(`   ${owner}/${repo}#${pr.number}: ${pr.title.substring(0, 50)}...`);
  
  try {
    // Check CI status
    const checks = await ghApi(`/repos/${owner}/${repo}/commits/${pr.head.sha}/check-runs`);
    const allChecksPass = checks.check_runs?.length > 0 && 
      checks.check_runs.every(c => 
        c.status === 'completed' && 
        ['success', 'neutral', 'skipped'].includes(c.conclusion)
      );
    
    // Check for blocking reviews
    const reviews = await ghApi(`/repos/${owner}/${repo}/pulls/${pr.number}/reviews`);
    const hasBlocker = reviews.some(r => r.state === 'CHANGES_REQUESTED');
    const isApproved = reviews.some(r => r.state === 'APPROVED');
    
    // Determine action
    if (allChecksPass && isApproved && !hasBlocker && pr.mergeable !== false && !pr.draft) {
      console.log(`     🚀 Ready to merge!`);
      if (!DRY_RUN) {
        try {
          await ghApi(`/repos/${owner}/${repo}/pulls/${pr.number}/merge`, {
            method: 'PUT',
            body: JSON.stringify({ merge_method: 'squash' })
          });
          console.log(`     ✅ Merged!`);
          stats.prs_merged++;
        } catch (e) {
          console.log(`     Merge failed: ${e.message}`);
        }
      } else {
        console.log(`     [DRY RUN] Would merge`);
      }
    } else if (allChecksPass && !isApproved && !hasBlocker) {
      // Request reviews from AI reviewers
      console.log(`     📝 CI passing, requesting reviews`);
      if (!DRY_RUN) {
        try {
          // Request Gemini review
          await ghApi(`/repos/${owner}/${repo}/issues/${pr.number}/comments`, {
            method: 'POST',
            body: JSON.stringify({ body: '@gemini-code-assist Please review this PR.' })
          });
          stats.reviews_requested++;
        } catch (e) {
          // Ignore comment errors
        }
      }
    }
  } catch (e) {
    console.log(`     Error: ${e.message}`);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    ECOSYSTEM HARVESTER                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Dry Run: ${DRY_RUN}`);
  console.log('');
  
  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN not set');
    process.exit(1);
  }
  
  await harvestCursorComposers();
  await harvestJulesSessions();
  await processPRs();
  
  // Write report
  writeFileSync('harvester-report.json', JSON.stringify(stats, null, 2));
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('                         HARVESTER REPORT                           ');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(JSON.stringify(stats, null, 2));
  console.log('\n✅ Ecosystem Harvester finished successfully');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
