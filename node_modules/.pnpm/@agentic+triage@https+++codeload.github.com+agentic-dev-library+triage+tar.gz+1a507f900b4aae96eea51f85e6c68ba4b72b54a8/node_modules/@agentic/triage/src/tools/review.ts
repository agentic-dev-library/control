import { tool } from 'ai';
import { z } from 'zod';
import { getPRReviewComments, submitPRReview } from '../octokit.js';
import { codeReviewSchema } from '../schemas/review.js';

export const submitCodeReviewTool = tool({
    description: 'Submit a code review for a pull request.',
    inputSchema: z.object({
        pullRequestId: z.number().describe('The ID of the pull request.'),
        review: codeReviewSchema.describe('The code review to submit.'),
    }),
    execute: async ({ pullRequestId, review }) => {
        await submitPRReview(pullRequestId, 'COMMENT', review.summary);
        return { success: true };
    },
});

export const getPRCommentsTool = tool({
    description: 'Get comments on a PR.',
    inputSchema: z.object({
        prNumber: z.number().describe('The pull request number.'),
    }),
    execute: async ({ prNumber }) => {
        const comments = await getPRReviewComments(prNumber);
        return { comments };
    },
});
