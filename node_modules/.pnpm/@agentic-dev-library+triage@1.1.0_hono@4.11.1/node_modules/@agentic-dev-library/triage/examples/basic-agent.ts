import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { getTriageTools } from '../src/index.js';

/**
 * Basic example of using agentic-triage tools with the Vercel AI SDK.
 *
 * This example shows how to:
 * 1. Import getTriageTools
 * 2. Pass them to generateText
 * 3. Run a simple triage task
 */
async function main() {
    try {
        const result = await generateText({
            model: anthropic('claude-3-5-sonnet-latest'),
            tools: getTriageTools(),
            maxSteps: 10,
            prompt: 'Find all open critical bugs and summarize them.',
        });

        console.log(result.text);
    } catch (error) {
        console.error('Failed to generate text:', error);
        process.exit(1);
    }
}

main().catch(console.error);
