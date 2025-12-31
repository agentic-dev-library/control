/**
 * Vercel AI SDK Tools for Triage Operations
 */

import { tool } from 'ai';
import { z } from 'zod';
import * as handlers from '../handlers/issue.js';
import * as reviewHandlers from '../handlers/review.js';
import { CodeReviewSchema } from '../schemas/review.js';
import { TriageConnectors } from './connectors.js';

// =============================================================================
// Shared Triage Connectors Instance
// =============================================================================

// Lazy-initialized singleton for tool execution
let _triageConnectors: TriageConnectors | null = null;

function getConnectors(customConnectors?: TriageConnectors): TriageConnectors {
    if (customConnectors) return customConnectors;
    if (!_triageConnectors) {
        _triageConnectors = new TriageConnectors();
    }
    return _triageConnectors;
}

/**
 * Set a custom TriageConnectors instance for tool execution.
 * Useful for testing or custom configurations.
 */
export function setTriageConnectors(connectors: TriageConnectors | null): void {
    _triageConnectors = connectors;
}

// Type for tool record
type ToolRecord = Record<string, any>;

// =============================================================================
// Issue Tools
// =============================================================================

/**
 * Get all issue management tools for Vercel AI SDK
 */
export function getIssueTools(customConnectors?: TriageConnectors): ToolRecord {
    const connectors = getConnectors(customConnectors);
    return {
        list_issues: tool({
            description:
                'List issues from the issue tracker with optional filters. ' +
                'Returns an array of issues with id, title, status, priority, type, and labels.',
            inputSchema: z.object({
                status: z.enum(['open', 'in_progress', 'blocked', 'closed']).optional().describe('Filter by status'),
                priority: z
                    .enum(['critical', 'high', 'medium', 'low', 'backlog'])
                    .optional()
                    .describe('Filter by priority'),
                type: z.enum(['bug', 'feature', 'task', 'epic', 'chore', 'docs']).optional().describe('Filter by type'),
                labels: z.array(z.string()).optional().describe('Filter by labels (AND logic)'),
                limit: z.number().optional().describe('Maximum number of results'),
                assignee: z.string().optional().describe('Filter by assignee'),
            }),
            execute: async (args) => {
                const issues = await handlers.handleListIssues(args, connectors);
                return {
                    count: issues.length,
                    issues: issues.map((i) => ({
                        id: i.id,
                        title: i.title,
                        status: i.status,
                        priority: i.priority,
                        type: i.type,
                        labels: i.labels,
                        assignee: i.assignee,
                        url: i.url,
                    })),
                };
            },
        }),
        get_issue: tool({
            description: 'Get detailed information about a specific issue by its ID.',
            inputSchema: z.object({
                id: z.string().describe('The issue ID'),
            }),
            execute: async ({ id }) => {
                const issue = await handlers.handleGetIssue(id, connectors);
                if (!issue) {
                    return { found: false, message: `Issue ${id} not found` };
                }
                return {
                    found: true,
                    issue: {
                        id: issue.id,
                        title: issue.title,
                        description: issue.description,
                        status: issue.status,
                        priority: issue.priority,
                        type: issue.type,
                        labels: issue.labels,
                        assignee: issue.assignee,
                        createdAt: issue.createdAt,
                        updatedAt: issue.updatedAt,
                        url: issue.url,
                    },
                };
            },
        }),
        create_issue: tool({
            description:
                'Create a new issue in the issue tracker. ' + 'Returns the created issue with its assigned ID.',
            inputSchema: z.object({
                title: z.string().describe('Issue title'),
                description: z.string().optional().describe('Issue description/body'),
                type: z
                    .enum(['bug', 'feature', 'task', 'epic', 'chore', 'docs'])
                    .optional()
                    .default('task')
                    .describe('Issue type'),
                priority: z
                    .enum(['critical', 'high', 'medium', 'low', 'backlog'])
                    .optional()
                    .default('medium')
                    .describe('Issue priority'),
                labels: z.array(z.string()).optional().describe('Labels to add'),
                assignee: z.string().optional().describe('Assignee username'),
            }),
            execute: async ({ title, description, type, priority, labels, assignee }) => {
                const issue = await connectors.issues.create({
                    title,
                    description,
                    type,
                    priority,
                    labels,
                    assignee,
                });
                return {
                    success: true,
                    issue: {
                        id: issue.id,
                        title: issue.title,
                        status: issue.status,
                        priority: issue.priority,
                        type: issue.type,
                        url: issue.url,
                    },
                };
            },
        }),
        update_issue: tool({
            description: 'Update an existing issue. Only provided fields will be updated.',
            inputSchema: z.object({
                id: z.string().describe('The issue ID to update'),
                title: z.string().optional().describe('New title'),
                description: z.string().optional().describe('New description'),
                status: z.enum(['open', 'in_progress', 'blocked', 'closed']).optional().describe('New status'),
                priority: z.enum(['critical', 'high', 'medium', 'low', 'backlog']).optional().describe('New priority'),
                type: z.enum(['bug', 'feature', 'task', 'epic', 'chore', 'docs']).optional().describe('New type'),
                assignee: z.string().optional().describe('New assignee'),
            }),
            execute: async ({ id, title, description, status, priority, type, assignee }) => {
                const issue = await connectors.issues.update(id, {
                    title,
                    description,
                    status,
                    priority,
                    type,
                    assignee,
                });
                return {
                    success: true,
                    issue: {
                        id: issue.id,
                        title: issue.title,
                        status: issue.status,
                        priority: issue.priority,
                    },
                };
            },
        }),
        close_issue: tool({
            description: 'Close an issue with an optional reason.',
            inputSchema: z.object({
                id: z.string().describe('The issue ID to close'),
                reason: z.string().optional().describe('Reason for closing (e.g., "Fixed in PR #123")'),
            }),
            execute: async ({ id, reason }) => {
                const issue = await connectors.issues.close(id, reason);
                return {
                    success: true,
                    message: `Issue ${id} closed`,
                    issue: {
                        id: issue.id,
                        title: issue.title,
                        status: issue.status,
                    },
                };
            },
        }),
        search_issues: tool({
            description: 'Search issues by text query. Searches in title and description.',
            inputSchema: z.object({
                query: z.string().describe('Search query'),
                status: z.enum(['open', 'in_progress', 'blocked', 'closed']).optional().describe('Filter by status'),
                limit: z.number().optional().default(20).describe('Maximum results'),
            }),
            execute: async ({ query, status, limit }) => {
                const issues = await connectors.issues.search(query, { status, limit });
                return {
                    query,
                    count: issues.length,
                    issues: issues.map((i) => ({
                        id: i.id,
                        title: i.title,
                        status: i.status,
                        priority: i.priority,
                        type: i.type,
                    })),
                };
            },
        }),
        get_ready_work: tool({
            description:
                'Get issues that are ready to work on (no blockers). ' +
                'Sorted by priority. Use this to find the next task to work on.',
            inputSchema: z.object({
                limit: z.number().optional().default(10).describe('Maximum number of results'),
            }),
            execute: async ({ limit }) => {
                const readyWork = await connectors.issues.getReadyWork({ limit });
                return {
                    count: readyWork.length,
                    issues: readyWork.map((rw) => ({
                        id: rw.issue.id,
                        title: rw.issue.title,
                        priority: rw.issue.priority,
                        type: rw.issue.type,
                        labels: rw.issue.labels,
                        resolvedBlockers: rw.resolvedBlockers,
                    })),
                };
            },
        }),
        get_issue_stats: tool({
            description:
                'Get statistics about issues - counts by status, priority, and type. ' +
                'Useful for understanding the current state of the backlog.',
            inputSchema: z.object({}),
            execute: async () => {
                const stats = await connectors.issues.getStats();
                return {
                    total: stats.total,
                    byStatus: {
                        open: stats.open,
                        inProgress: stats.inProgress,
                        blocked: stats.blocked,
                        closed: stats.closed,
                    },
                    byPriority: stats.byPriority,
                    byType: stats.byType,
                };
            },
        }),
        add_labels: tool({
            description: 'Add labels to an issue.',
            inputSchema: z.object({
                id: z.string().describe('The issue ID'),
                labels: z.array(z.string()).describe('Labels to add'),
            }),
            execute: async ({ id, labels }) => {
                await connectors.issues.addLabels(id, labels);
                return {
                    success: true,
                    message: `Added labels [${labels.join(', ')}] to issue ${id}`,
                };
            },
        }),
        remove_labels: tool({
            description: 'Remove labels from an issue.',
            inputSchema: z.object({
                id: z.string().describe('The issue ID'),
                labels: z.array(z.string()).describe('Labels to remove'),
            }),
            execute: async ({ id, labels }) => {
                await connectors.issues.removeLabels(id, labels);
                return {
                    success: true,
                    message: `Removed labels [${labels.join(', ')}] from issue ${id}`,
                };
            },
        }),
    };
}

/**
 * Individual tool instances (using default connectors)
 */
export const listIssuesTool = getIssueTools().list_issues;
export const getIssueTool = getIssueTools().get_issue;
export const createIssueTool = getIssueTools().create_issue;
export const updateIssueTool = getIssueTools().update_issue;
export const closeIssueTool = getIssueTools().close_issue;
export const searchIssuesTool = getIssueTools().search_issues;
export const getReadyWorkTool = getIssueTools().get_ready_work;
export const getIssueStatsTool = getIssueTools().get_issue_stats;
export const addLabelsTool = getIssueTools().add_labels;
export const removeLabelsTool = getIssueTools().remove_labels;

// =============================================================================
// Project Tools
// =============================================================================

/**
 * Get all project management tools for Vercel AI SDK
 */
export function getProjectTools(customConnectors?: TriageConnectors): ToolRecord {
    const connectors = getConnectors(customConnectors);
    return {
        get_current_sprint: tool({
            description: 'Get the current active sprint/iteration. Returns sprint details or null if no active sprint.',
            inputSchema: z.object({}),
            execute: async () => {
                const sprint = await connectors.projects.getCurrentSprint();
                if (!sprint) {
                    return { found: false, message: 'No active sprint found' };
                }
                return { found: true, sprint };
            },
        }),
        list_sprints: tool({
            description: 'List all sprints/iterations.',
            inputSchema: z.object({}),
            execute: async () => {
                const sprints = await connectors.projects.getSprints();
                return {
                    count: sprints.length,
                    sprints,
                };
            },
        }),
    };
}

export const getCurrentSprintTool = getProjectTools().get_current_sprint;
export const listSprintsTool = getProjectTools().list_sprints;

// =============================================================================
// Review Tools
// =============================================================================

/**
 * Get all review tools for Vercel AI SDK
 */
export function getReviewTools(customConnectors?: TriageConnectors): ToolRecord {
    const connectors = getConnectors(customConnectors);
    return {
        get_pr_comments: tool({
            description: 'Get review comments on a pull request.',
            inputSchema: z.object({
                prNumber: z.number().describe('The pull request number'),
            }),
            execute: async ({ prNumber }) => {
                const comments = await connectors.reviews.getPRComments(prNumber);
                return {
                    prNumber,
                    count: comments.length,
                    comments,
                };
            },
        }),
        submit_review: tool({
            description: 'Submit a structured code review for a pull request',
            inputSchema: z.object({
                prNumber: z.number().describe('The pull request number'),
                review: CodeReviewSchema,
            }),
            execute: async ({ prNumber, review }) => reviewHandlers.handleSubmitReview(prNumber, review),
        }),
    };
}

export const getPRCommentsTool = getReviewTools().get_pr_comments;
export const submitReviewTool = getReviewTools().submit_review;

/**
 * Get ALL triage tools for Vercel AI SDK
 */
export function getTriageTools(customConnectors?: TriageConnectors): ToolRecord {
    return {
        ...getIssueTools(customConnectors),
        ...getProjectTools(customConnectors),
        ...getReviewTools(customConnectors),
    };
}

/**
 * Tool definitions with metadata (using default connectors)
 */
export const ISSUE_TOOL_DEFINITIONS = [
    { name: 'list_issues', tool: listIssuesTool, description: 'List issues with filters' },
    { name: 'get_issue', tool: getIssueTool, description: 'Get issue by ID' },
    { name: 'create_issue', tool: createIssueTool, description: 'Create a new issue' },
    { name: 'update_issue', tool: updateIssueTool, description: 'Update an issue' },
    { name: 'close_issue', tool: closeIssueTool, description: 'Close an issue' },
    { name: 'search_issues', tool: searchIssuesTool, description: 'Search issues by text' },
    { name: 'get_ready_work', tool: getReadyWorkTool, description: 'Get issues ready to work on' },
    { name: 'get_issue_stats', tool: getIssueStatsTool, description: 'Get issue statistics' },
    { name: 'add_labels', tool: addLabelsTool, description: 'Add labels to an issue' },
    { name: 'remove_labels', tool: removeLabelsTool, description: 'Remove labels from an issue' },
];

export const PROJECT_TOOL_DEFINITIONS = [
    { name: 'get_current_sprint', tool: getCurrentSprintTool, description: 'Get current sprint' },
    { name: 'list_sprints', tool: listSprintsTool, description: 'List all sprints' },
];

export const REVIEW_TOOL_DEFINITIONS = [
    { name: 'get_pr_comments', tool: getPRCommentsTool, description: 'Get PR review comments' },
    { name: 'submit_review', tool: submitReviewTool, description: 'Submit structured code review' },
];
