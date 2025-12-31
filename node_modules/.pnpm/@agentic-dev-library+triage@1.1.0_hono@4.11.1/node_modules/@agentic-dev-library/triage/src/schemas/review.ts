import { z } from 'zod';

export const ReviewImpactSchema = z.enum(['low', 'medium', 'high', 'critical']);

export const CodeReviewCommentSchema = z.object({
    file: z.string().describe('The path to the file being commented on'),
    line: z.number().optional().describe('The line number (optional)'),
    content: z.string().describe('The review comment or feedback'),
    type: z.enum(['suggestion', 'issue', 'question', 'praise']).describe('The type of comment'),
    severity: z.enum(['low', 'medium', 'high']).optional().describe('How critical this feedback is'),
});

export const CodeReviewSchema = z.object({
    summary: z.string().describe('Overall summary of the review'),
    status: z.enum(['approve', 'request_changes', 'comment']).describe('The review decision'),
    comments: z.array(CodeReviewCommentSchema).describe('Individual review comments'),
    impact: ReviewImpactSchema.describe('Estimated impact of the changes'),
    suggestedLabels: z.array(z.string()).describe('Labels suggested based on the code changes'),
});

export type CodeReview = z.infer<typeof CodeReviewSchema>;
export type CodeReviewComment = z.infer<typeof CodeReviewCommentSchema>;
