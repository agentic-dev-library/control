#!/usr/bin/env node
/**
 * Ecosystem Sage
 *
 * On-call intelligent advisor that:
 * 1. Answers technical questions with codebase context
 * 2. Reviews code and provides feedback
 * 3. Decomposes complex tasks into actionable subtasks
 * 4. Unblocks stuck agents with guidance
 * 5. Routes work to appropriate agents (Cursor/Jules)
 *
 * Triggered by:
 * - @sage or /sage in comments
 * - workflow_call from Harvester/Curator
 * - Manual workflow_dispatch
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'https://ollama.com';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'glm-4.6:cloud';
const CURSOR_API_KEY = process.env.CURSOR_API_KEY;
const GOOGLE_JULES_API_KEY = process.env.GOOGLE_JULES_API_KEY;

// Context from event
const EVENT_NAME = process.env.EVENT_NAME;
const COMMENT_BODY = process.env.COMMENT_BODY || '';
const ISSUE_NUMBER = process.env.ISSUE_NUMBER;
const REPO_FULL_NAME = process.env.REPO_FULL_NAME;

// Workflow inputs
const INPUT_QUERY = process.env.INPUT_QUERY;
const INPUT_CONTEXT_REPO = process.env.INPUT_CONTEXT_REPO;
const INPUT_CONTEXT_ISSUE = process.env.INPUT_CONTEXT_ISSUE;

// ============================================================================
// API Clients
// ============================================================================

async function ghApi(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            ...options.headers,
        },
    });
    if (!res.ok) {
        throw new Error(`GitHub API ${res.status}`);
    }
    return res.json();
}

async function ollama(messages, options = {}) {
    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${OLLAMA_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages,
            stream: false,
            ...options,
        }),
    });

    if (!res.ok) {
        throw new Error(`Ollama API ${res.status}`);
    }

    const result = await res.json();
    return result.message?.content || '';
}

async function cursorApi(endpoint, options = {}) {
    if (!CURSOR_API_KEY) return null;
    const auth = Buffer.from(`${CURSOR_API_KEY}:`).toString('base64');
    const res = await fetch(`https://api.cursor.com${endpoint}`, {
        ...options,
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
        },
    });
    return res.json();
}

async function julesApi(endpoint, options = {}) {
    if (!GOOGLE_JULES_API_KEY) return null;
    const res = await fetch(`https://jules.googleapis.com/v1alpha${endpoint}`, {
        ...options,
        headers: {
            'X-Goog-Api-Key': GOOGLE_JULES_API_KEY,
            'Content-Type': 'application/json',
        },
    });
    return res.json();
}

// ============================================================================
// Codebase Context
// ============================================================================

function getRepoStructure(dir = '.', depth = 0, maxDepth = 3) {
    if (depth >= maxDepth) return '';

    let structure = '';
    const items = readdirSync(dir).filter(
        (f) => !f.startsWith('.') && !['node_modules', 'dist', 'build', '__pycache__', 'venv'].includes(f)
    );

    for (const item of items.slice(0, 20)) {
        // Limit items
        const path = join(dir, item);
        try {
            const stat = statSync(path);
            const indent = '  '.repeat(depth);
            if (stat.isDirectory()) {
                structure += `${indent}${item}/\n`;
                structure += getRepoStructure(path, depth + 1, maxDepth);
            } else {
                structure += `${indent}${item}\n`;
            }
        } catch (e) {
            // Skip inaccessible items
        }
    }
    return structure;
}

function getKeyFiles() {
    const keyFiles = ['README.md', 'CLAUDE.md', 'AGENTS.md', 'package.json', 'Cargo.toml', 'pyproject.toml'];
    const content = {};

    for (const file of keyFiles) {
        try {
            content[file] = readFileSync(file, 'utf-8').slice(0, 2000); // First 2000 chars
        } catch (e) {
            // File doesn't exist
        }
    }
    return content;
}

// ============================================================================
// Query Classification
// ============================================================================

function classifyQuery(query) {
    const lower = query.toLowerCase();

    if (lower.includes('review') || lower.includes('feedback') || lower.includes('look at')) {
        return 'REVIEW';
    }
    if (lower.includes('how') || lower.includes('what') || lower.includes('why') || lower.includes('explain')) {
        return 'QUESTION';
    }
    if (lower.includes('fix') || lower.includes('bug') || lower.includes('error') || lower.includes('broken')) {
        return 'FIX';
    }
    if (lower.includes('implement') || lower.includes('create') || lower.includes('add') || lower.includes('build')) {
        return 'IMPLEMENT';
    }
    if (lower.includes('refactor') || lower.includes('cleanup') || lower.includes('improve')) {
        return 'REFACTOR';
    }
    if (
        lower.includes('decompose') ||
        lower.includes('break down') ||
        lower.includes('plan') ||
        lower.includes('tasks')
    ) {
        return 'DECOMPOSE';
    }
    if (lower.includes('blocked') || lower.includes('stuck') || lower.includes('help')) {
        return 'UNBLOCK';
    }

    return 'GENERAL';
}

// ============================================================================
// Response Generation
// ============================================================================

async function generateResponse(query, context) {
    const queryType = classifyQuery(query);
    console.log(`Query type: ${queryType}`);

    const systemPrompt = `You are the Ecosystem Sage - an intelligent advisor for the jbcom organization's codebase.

Your role:
1. Answer technical questions with accuracy
2. Provide code review feedback
3. Decompose complex tasks into subtasks
4. Help unblock stuck developers/agents
5. Recommend which agent (Cursor for quick fixes, Jules for refactors) should handle work

Context about this repository:
${JSON.stringify(context.keyFiles, null, 2)}

Repository structure:
${context.structure}

Guidelines:
- Be concise and actionable
- Reference specific files when relevant
- If recommending agent work, specify exactly what the agent should do
- For task decomposition, create numbered subtasks with clear scope
- Never hallucinate - if unsure, say so
- Format responses in Markdown`;

    const userPrompt = `Query Type: ${queryType}

${context.issueContext ? `Issue/PR Context:\n${context.issueContext}\n\n` : ''}

Query:
${query}

Please provide your response:`;

    try {
        const response = await ollama([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ]);

        return { response, queryType };
    } catch (e) {
        console.error(`Ollama error: ${e.message}`);
        return {
            response: `⚠️ Sage is temporarily unavailable (Ollama error). Please try again later or consult the documentation in CLAUDE.md and AGENTS.md.`,
            queryType,
        };
    }
}

// ============================================================================
// Task Decomposition
// ============================================================================

async function decomposeTask(task, context) {
    const systemPrompt = `You are a task decomposition expert. Break down the given task into specific, actionable subtasks.

For each subtask, specify:
1. A clear title
2. What needs to be done
3. Which agent should handle it:
   - CURSOR: Quick fixes, single-file changes, debugging
   - JULES: Multi-file refactors, documentation, complex features
   - HUMAN: Decisions requiring human judgment

Output as a numbered list with agent assignments.`;

    const userPrompt = `Task to decompose:
${task}

Repository context:
${context.structure}

Break this into subtasks:`;

    try {
        const response = await ollama([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ]);

        return response;
    } catch (e) {
        return `Unable to decompose task: ${e.message}`;
    }
}

// ============================================================================
// Agent Spawning
// ============================================================================

async function spawnAgent(type, task, repo) {
    if (type === 'CURSOR' && CURSOR_API_KEY) {
        console.log(`Spawning Cursor agent for: ${task.slice(0, 50)}...`);
        return cursorApi('/v0/agents', {
            method: 'POST',
            body: JSON.stringify({
                prompt: { text: task },
                source: { repository: `https://github.com/${repo}`, ref: 'main' },
                target: { autoCreatePr: true },
            }),
        });
    }

    if (type === 'JULES' && GOOGLE_JULES_API_KEY) {
        console.log(`Creating Jules session for: ${task.slice(0, 50)}...`);
        const [owner, repoName] = repo.split('/');
        return julesApi('/sessions', {
            method: 'POST',
            body: JSON.stringify({
                prompt: task,
                sourceContext: {
                    source: `sources/github/${owner}/${repoName}`,
                    githubRepoContext: { startingBranch: 'main' },
                },
                automationMode: 'AUTO_CREATE_PR',
            }),
        });
    }

    return null;
}

// ============================================================================
// Main
// ============================================================================

async function sage() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                    ECOSYSTEM SAGE - ON CALL                      ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log(`\nTime: ${new Date().toISOString()}`);
    console.log(`Event: ${EVENT_NAME}`);

    // Determine the query
    let query = '';
    let repo = REPO_FULL_NAME;
    let issueNum = ISSUE_NUMBER;

    if (EVENT_NAME === 'issue_comment' || EVENT_NAME === 'pull_request_review_comment') {
        // Extract query from comment (remove @sage or /sage prefix)
        query = COMMENT_BODY.replace(/@sage\s*/gi, '')
            .replace(/\/sage\s*/gi, '')
            .trim();
        console.log(`\nComment query: ${query.slice(0, 100)}...`);
    } else if (INPUT_QUERY) {
        query = INPUT_QUERY;
        repo = INPUT_CONTEXT_REPO || repo;
        issueNum = INPUT_CONTEXT_ISSUE || issueNum;
        console.log(`\nInput query: ${query.slice(0, 100)}...`);
    } else {
        console.log('No query provided');
        process.exit(0);
    }

    // Gather context
    console.log('\nGathering codebase context...');
    const structure = getRepoStructure();
    const keyFiles = getKeyFiles();

    // Get issue/PR context if available
    let issueContext = '';
    if (issueNum && repo) {
        try {
            const issue = await ghApi(`/repos/${repo}/issues/${issueNum}`);
            issueContext = `Title: ${issue.title}\n\nBody:\n${issue.body?.slice(0, 1000) || 'No body'}`;
        } catch (e) {
            console.log('Could not fetch issue context');
        }
    }

    const context = { structure, keyFiles, issueContext };

    // Generate response
    console.log('\nGenerating response...');
    const { response, queryType } = await generateResponse(query, context);

    // Handle special query types
    let finalResponse = response;

    if (queryType === 'DECOMPOSE') {
        console.log('\nDecomposing task...');
        const decomposition = await decomposeTask(query, context);
        finalResponse = `## 🎯 Task Decomposition\n\n${decomposition}`;
    }

    // Format the response
    const formattedResponse = `## 🔮 Sage Response

${finalResponse}

---
<sub>🤖 Ecosystem Sage | Query type: ${queryType} | [How to use](https://github.com/jbcom/control-center/blob/main/CLAUDE.md)</sub>`;

    console.log('\n=== Response ===');
    console.log(formattedResponse);

    // Save response for workflow to post
    writeFileSync('sage-response.md', formattedResponse);

    // Output for workflow_call
    console.log(`::set-output name=response::${response.replace(/\n/g, '%0A')}`);

    console.log('\n✅ Sage complete');
}

sage().catch((e) => {
    console.error('Sage error:', e);
    writeFileSync(
        'sage-response.md',
        `## ⚠️ Sage Error\n\n${e.message}\n\nPlease try again or consult CLAUDE.md for guidance.`
    );
    process.exit(1);
});
