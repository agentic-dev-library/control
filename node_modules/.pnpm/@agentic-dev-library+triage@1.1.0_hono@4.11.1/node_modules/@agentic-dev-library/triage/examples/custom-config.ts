import { getTriageTools, setTriageConnectors, TriageConnectors } from '../src/index.js';

/**
 * Example showing how to manually configure the triage connectors.
 *
 * By default, the tools use environment variables (like GH_TOKEN),
 * but you can also configure them programmatically.
 */
async function main() {
    try {
        // Configure before using tools
        const connectors = new TriageConnectors({
            provider: 'github',
            github: {
                repo: process.env.GITHUB_REPO || 'myorg/myrepo',
                token: process.env.GITHUB_TOKEN,
            },
        });

        setTriageConnectors(connectors);

        // Now tools will use this configuration
        const _tools = getTriageTools();

        console.log(`Tools configured for ${process.env.GITHUB_REPO || 'myorg/myrepo'}`);
    } catch (error) {
        console.error('Configuration failed:', error);
        process.exit(1);
    }
}

main().catch(console.error);
