import type { Tool } from 'ai';
import * as issueTools from './issue.js';
import * as reviewTools from './review.js';
import * as triageTools from './triage.js';

export * from './issue.js';
export * from './review.js';
export * from './triage.js';

/** Tool map type for type safety */
type ToolMap = Record<string, Tool>;

/**
 * Get all triage tools (issues, reviews, and triage)
 */
export function getTriageTools(): ToolMap {
    return {
        ...getIssueTools(),
        ...getReviewTools(),
        ...triageTools,
    };
}

/**
 * Get issue management tools
 */
export function getIssueTools(): ToolMap {
    return {
        listIssues: issueTools.listIssuesTool,
        getIssue: issueTools.getIssueTool,
        createIssue: issueTools.createIssueTool,
        updateIssue: issueTools.updateIssueTool,
        closeIssue: issueTools.closeIssueTool,
        searchIssues: issueTools.searchIssuesTool,
        addLabels: issueTools.addLabelsTool,
        removeLabels: issueTools.removeLabelsTool,
    };
}

/**
 * Get pull request and code review tools
 */
export function getReviewTools(): ToolMap {
    return {
        submitCodeReview: reviewTools.submitCodeReviewTool,
        getPRComments: reviewTools.getPRCommentsTool,
    };
}

/**
 * Get project management tools (placeholder)
 */
export function getProjectTools(): ToolMap {
    return {};
}
