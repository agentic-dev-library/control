import { z } from 'zod';

export const IssueStatusSchema = z.enum(['open', 'in_progress', 'blocked', 'closed']);
export const IssuePrioritySchema = z.enum(['critical', 'high', 'medium', 'low', 'backlog']);
export const IssueTypeSchema = z.enum(['bug', 'feature', 'task', 'epic', 'chore', 'docs']);

export const IssueTriageSchema = z.object({
    title: z.string().describe('The cleaned up or optimized title for the issue'),
    summary: z.string().describe('A concise summary of the issue'),
    type: IssueTypeSchema.describe('The categorized type of the issue'),
    priority: IssuePrioritySchema.describe('The determined priority based on impact and urgency'),
    labels: z.array(z.string()).describe('Recommended labels for the issue'),
    estimate: z.number().optional().describe('Optional story point estimate'),
    actionItems: z
        .array(z.string())
        .describe('Concrete next steps or requirements discovered from the issue description'),
});

export type IssueTriage = z.infer<typeof IssueTriageSchema>;
