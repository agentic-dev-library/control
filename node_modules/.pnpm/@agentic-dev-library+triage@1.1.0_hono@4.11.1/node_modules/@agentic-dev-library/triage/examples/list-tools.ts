import { getTriageTools } from '../src/index.js';

/**
 * Example of how to retrieve the triage tools for use with the Vercel AI SDK.
 */
function main() {
    const tools = getTriageTools();

    console.log('Available tools:');
    for (const toolName of Object.keys(tools)) {
        console.log(`- ${toolName}`);
    }

    // Example tool: listIssues
    if (tools.listIssues) {
        console.log('\nTool: listIssues');
        console.log('Description:', (tools.listIssues as any).description);
    }
}

main();
