import { tool } from 'ai';
import { z } from 'zod';
import * as handlers from '../handlers/issue.js';
import { IssueTriageSchema } from '../schemas/issue.js';
import { TriageConnectors } from '../triage/connectors.js';

export const listIssuesTool = tool({
    description: 'List issues from the issue tracker with optional filters.',
    inputSchema: z.object({
        status: z.enum(['open', 'in_progress', 'blocked', 'closed']).optional(),
        priority: z.enum(['critical', 'high', 'medium', 'low', 'backlog']).optional(),
        type: z.enum(['bug', 'feature', 'task', 'epic', 'chore', 'docs']).optional(),
        labels: z.array(z.string()).optional(),
        limit: z.number().optional(),
        assignee: z.string().optional(),
    }),
    execute: async (args) => handlers.handleListIssues(args),
});

export const getIssueTool = tool({
    description: 'Get detailed issue by ID.',
    inputSchema: z.object({
        id: z.string().describe('The issue ID'),
    }),
    execute: async ({ id }) => handlers.handleGetIssue(id),
});

export const createIssueTool = tool({
    description: 'Create a new issue in the issue tracker.',
    inputSchema: z.object({
        title: z.string().describe('Issue title'),
        description: z.string().optional().describe('Issue description/body'),
        type: z.enum(['bug', 'feature', 'task', 'epic', 'chore', 'docs']).optional().default('task'),
        priority: z.enum(['critical', 'high', 'medium', 'low', 'backlog']).optional().default('medium'),
        labels: z.array(z.string()).optional(),
        assignee: z.string().optional(),
    }),
    execute: async (options) => {
        const connectors = new TriageConnectors();
        return connectors.issues.create(options);
    },
});

export const updateIssueTool = tool({
    description: 'Update issue fields.',
    inputSchema: z.object({
        id: z.string().describe('The issue ID to update'),
        updates: z.object({
            title: z.string().optional(),
            description: z.string().optional(),
            status: z.enum(['open', 'in_progress', 'blocked', 'closed']).optional(),
            priority: z.enum(['critical', 'high', 'medium', 'low', 'backlog']).optional(),
            type: z.enum(['bug', 'feature', 'task', 'epic', 'chore', 'docs']).optional(),
            assignee: z.string().optional(),
        }),
    }),
    execute: async ({ id, updates }) => {
        const connectors = new TriageConnectors();
        return connectors.issues.update(id, updates);
    },
});

export const triageIssueTool = tool({
    description: 'Apply structured triage analysis to an issue (title, priority, type, labels, etc.)',
    inputSchema: z.object({
        id: z.string().describe('The issue ID to triage'),
        analysis: IssueTriageSchema,
    }),
    execute: async ({ id, analysis }) => handlers.handleTriageIssue(id, analysis),
});

export const closeIssueTool = tool({
    description: 'Close issue with reason.',
    inputSchema: z.object({
        id: z.string().describe('The ID of the issue to close.'),
        reason: z.string().optional().describe('Optional reason for closing.'),
    }),
    execute: async ({ id, reason }) => {
        const connectors = new TriageConnectors();
        return connectors.issues.close(id, reason);
    },
});

export const searchIssuesTool = tool({
    description: 'Full-text search across issues.',
    inputSchema: z.object({
        query: z.string().describe('The search query.'),
    }),
    execute: async ({ query }) => {
        const connectors = new TriageConnectors();
        return connectors.issues.search(query);
    },
});

export const addLabelsTool = tool({
    description: 'Add labels to an issue.',
    inputSchema: z.object({
        id: z.string().describe('The ID of the issue.'),
        labels: z.array(z.string()).describe('The labels to add.'),
    }),
    execute: async ({ id, labels }) => {
        const connectors = new TriageConnectors();
        await connectors.issues.addLabels(id, labels);
        return { id, labelsAdded: labels };
    },
});

export const removeLabelsTool = tool({
    description: 'Remove labels from an issue.',
    inputSchema: z.object({
        id: z.string().describe('The ID of the issue.'),
        labels: z.array(z.string()).describe('The labels to remove.'),
    }),
    execute: async ({ id, labels }) => {
        const connectors = new TriageConnectors();
        await connectors.issues.removeLabels(id, labels);
        return { id, labelsRemoved: labels };
    },
});
