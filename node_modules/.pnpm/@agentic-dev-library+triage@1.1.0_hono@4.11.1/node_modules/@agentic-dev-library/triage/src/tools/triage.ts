import { tool } from 'ai';
import { z } from 'zod';
import { getPullRequest } from '../octokit.js';
import { TriageConnectors } from '../triage/index.js';

export const triageTool = tool({
    description: 'Perform a triage analysis of an issue or pull request.',
    inputSchema: z.object({
        id: z.union([z.number(), z.string()]).describe('The ID of the issue or pull request to triage.'),
        type: z.enum(['issue', 'pull-request']).describe('The type of item to triage.'),
    }),
    execute: async ({ id, type }: { id: string | number; type: 'issue' | 'pull-request' }) => {
        if (type === 'issue') {
            const connectors = new TriageConnectors();
            const issue = await connectors.issues.get(String(id));
            return {
                id: issue?.id,
                title: issue?.title,
                description: issue?.description,
                type: 'issue',
            };
        }
        // PRs are still handled via GitHub MCP for now
        const pr = await getPullRequest(Number(id));
        return {
            id: pr.number,
            title: pr.title,
            body: pr.body,
            type: 'pull-request',
        };
    },
});
