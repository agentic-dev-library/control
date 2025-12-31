// Complete triage primitives example

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { getTriageTools, TriageConnectors } from '../src/index.js';

/**
 * Complete example showcasing @agentic-dev-library/triage primitives:
 *
 * 1. Direct API usage (TriageConnectors)
 * 2. Vercel AI SDK Tools (getTriageTools)
 * 3. AI-powered triage agent
 */
async function main() {
    console.log('=== @agentic-dev-library/triage Complete Example ===\n');

    // ===================================================================
    // 1. Direct API Usage
    // ===================================================================
    console.log('1. Using TriageConnectors (Direct API)...\n');

    const triage = new TriageConnectors({
        provider: 'github',
        github: { owner: 'myorg', repo: 'myrepo' },
    });

    // List issues
    const issues = await triage.issues.list({
        status: 'open',
        priority: 'high',
    });
    console.log(`Found ${issues.length} high-priority open issues`);

    // Create issue
    const newIssue = await triage.issues.create({
        title: 'Example issue',
        body: 'Testing triage primitives',
        type: 'task',
        priority: 'medium',
    });
    console.log(`Created issue: ${newIssue.id}\n`);

    // ===================================================================
    // 2. Vercel AI SDK Tools
    // ===================================================================
    console.log('2. Using AI SDK Tools (Vercel AI SDK)...\n');

    const tools = getTriageTools();
    console.log('Available tools:', Object.keys(tools).join(', '));
    console.log();

    // ===================================================================
    // 3. AI-Powered Agent
    // ===================================================================
    console.log('3. Running AI-Powered Triage Agent...\n');

    const result = await generateText({
        model: anthropic('claude-sonnet-4-20250514'),
        tools,
        maxSteps: 10,
        prompt: `
            Analyze our issue backlog and:
            1. List all open critical bugs
            2. Summarize their impact
            3. Recommend prioritization
        `,
    });

    console.log('Agent response:');
    console.log(result.text);

    // ===================================================================
    // 4. Project Management
    // ===================================================================
    console.log('\n4. Project Management...\n');

    const sprints = await triage.projects.getSprints();
    console.log(`Active sprints: ${sprints.length}`);

    const readyWork = await triage.projects.getReadyWork();
    console.log(`Work items ready to start: ${readyWork.issues.length}`);

    const stats = await triage.projects.getIssueStats();
    console.log('Issue stats:', JSON.stringify(stats, null, 2));
}

// Run example
main().catch(console.error);
