import { z } from 'zod';
import { IssueTriageSchema } from './issue.js';
import { CodeReviewSchema } from './review.js';

export const triageAnalysisSchema = z.object({
    issueAnalysis: IssueTriageSchema.optional().describe('Analysis of the issue.'),
    codeReview: CodeReviewSchema.optional().describe('Code review of the pull request.'),
    triage: z.string().describe('The overall triage assessment.'),
});
