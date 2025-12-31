import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { createIssueTool, listIssuesTool, searchIssuesTool } from '../src/index.js';

/**
 * Example showing how to use only a subset of available tools.
 *
 * This is useful for minimizing the tool space and providing
 * only what the agent needs for a specific task.
 */
async function main() {
    try {
        const minimalTools = {
            listIssues: listIssuesTool,
            createIssue: createIssueTool,
            searchIssues: searchIssuesTool,
        };

        console.log('Available minimal tools:', Object.keys(minimalTools));

        const result = await generateText({
            model: anthropic('claude-3-5-sonnet-latest'),
            tools: minimalTools,
            maxSteps: 5,
            prompt: 'List the open issues and create a summary report.',
        });

        console.log(result.text);
    } catch (error) {
        console.error('Failed to run agent:', error);
        process.exit(1);
    }
}

main().catch(console.error);
