import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as octokit from './octokit.js';

const server = new McpServer({
    name: 'agentic-triage',
    version: '1.0.0',
});

// Issues
server.tool(
    'list_issues',
    {
        status: z.enum(['open', 'closed', 'all']).optional().default('open'),
        limit: z.number().optional().default(50),
    },
    async ({ status, limit }) => {
        try {
            const query = status === 'all' ? '' : `is:${status}`;
            const issues = await octokit.searchIssues(query);
            return {
                content: [{ type: 'text', text: JSON.stringify(issues.slice(0, limit), null, 2) }],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Error listing issues: ${error.message}` }],
                isError: true,
            };
        }
    }
);

server.tool(
    'get_issue',
    {
        id: z.number().describe('Issue number'),
    },
    async ({ id }) => {
        try {
            const issue = await octokit.getIssue(id);
            return {
                content: [{ type: 'text', text: JSON.stringify(issue, null, 2) }],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Error getting issue #${id}: ${error.message}` }],
                isError: true,
            };
        }
    }
);

server.tool(
    'create_issue',
    {
        title: z.string(),
        body: z.string().optional(),
        type: z.enum(['bug', 'feature', 'docs', 'test', 'refactor', 'chore']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        labels: z.array(z.string()).optional(),
        assignees: z.array(z.string()).optional(),
    },
    async (args) => {
        try {
            const labels = args.labels || [];
            if (args.type) labels.push(`type:${args.type}`);
            if (args.priority) labels.push(`priority:${args.priority}`);

            const issue = await octokit.createIssue({
                title: args.title,
                body: args.body || '',
                labels,
                assignees: args.assignees,
            });
            return {
                content: [{ type: 'text', text: JSON.stringify(issue, null, 2) }],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Error creating issue: ${error.message}` }],
                isError: true,
            };
        }
    }
);

server.tool(
    'update_issue',
    {
        id: z.number(),
        title: z.string().optional(),
        body: z.string().optional(),
        state: z.enum(['open', 'closed']).optional(),
        labels: z.array(z.string()).optional(),
        assignees: z.array(z.string()).optional(),
    },
    async ({ id, ...updates }) => {
        try {
            await octokit.updateIssue(id, updates);
            return {
                content: [{ type: 'text', text: `Issue #${id} updated successfully` }],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Error updating issue #${id}: ${error.message}` }],
                isError: true,
            };
        }
    }
);

server.tool(
    'close_issue',
    {
        id: z.number(),
        reason: z.string().optional(),
    },
    async ({ id, reason }) => {
        try {
            await octokit.updateIssue(id, { state: 'closed' });
            if (reason) {
                await octokit.addIssueComment(id, `Closing issue: ${reason}`);
            }
            return {
                content: [{ type: 'text', text: `Issue #${id} closed successfully` }],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Error closing issue #${id}: ${error.message}` }],
                isError: true,
            };
        }
    }
);

server.tool(
    'search_issues',
    {
        query: z.string(),
    },
    async ({ query }) => {
        try {
            const issues = await octokit.searchIssues(query);
            return {
                content: [{ type: 'text', text: JSON.stringify(issues, null, 2) }],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Error searching issues with query "${query}": ${error.message}` }],
                isError: true,
            };
        }
    }
);

server.tool(
    'add_labels',
    {
        id: z.number(),
        labels: z.array(z.string()),
    },
    async ({ id, labels }) => {
        try {
            await octokit.addIssueLabels(id, labels);
            return {
                content: [{ type: 'text', text: `Labels added to issue #${id}` }],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Error adding labels to issue #${id}: ${error.message}` }],
                isError: true,
            };
        }
    }
);

server.tool(
    'remove_labels',
    {
        id: z.number(),
        labels: z.array(z.string()),
    },
    async ({ id, labels }) => {
        try {
            const issue = await octokit.getIssue(id);
            const remaining = issue.labels.filter((l: any) => !labels.includes(typeof l === 'string' ? l : l.name));
            await octokit.updateIssue(id, { labels: remaining });
            return {
                content: [{ type: 'text', text: `Labels removed from issue #${id}` }],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Error removing labels from issue #${id}: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// Reviews
server.tool(
    'get_pr_comments',
    {
        id: z.number().describe('Pull request number'),
    },
    async ({ id }) => {
        try {
            const comments = await octokit.getPRReviewComments(id);
            return {
                content: [{ type: 'text', text: JSON.stringify(comments, null, 2) }],
            };
        } catch (error: any) {
            return {
                content: [{ type: 'text', text: `Error getting comments for PR #${id}: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// Sprints (stubs for now, will implement if possible)
server.tool('list_sprints', {}, async () => {
    return {
        content: [{ type: 'text', text: 'Sprint tools not yet implemented' }],
    };
});

server.tool('get_current_sprint', {}, async () => {
    return {
        content: [{ type: 'text', text: 'Sprint tools not yet implemented' }],
    };
});

/**
 * Start the MCP server
 */
export async function runMcpServer() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('Agentic Triage MCP Server running on stdio');
    } catch (error) {
        console.error('Failed to start MCP server:', error);
        process.exit(1);
    }
}
