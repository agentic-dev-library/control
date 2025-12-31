import {
    addLabelsTool,
    closeIssueTool,
    createIssueTool,
    getIssueTool,
    listIssuesTool,
    removeLabelsTool,
    searchIssuesTool,
    triageIssueTool,
    updateIssueTool,
} from './issue.js';
import { analyzePRTool } from './pr.js';
import { submitReviewTool } from './review.js';

export * from './issue.js';
export * from './pr.js';
export * from './review.js';

export const triageTools = {
    listIssues: listIssuesTool,
    getIssue: getIssueTool,
    createIssue: createIssueTool,
    updateIssue: updateIssueTool,
    closeIssue: closeIssueTool,
    searchIssues: searchIssuesTool,
    addLabels: addLabelsTool,
    removeLabels: removeLabelsTool,
    triageIssue: triageIssueTool,
    submitReview: submitReviewTool,
    analyzePR: analyzePRTool,
};

export function getTriageTools() {
    return triageTools;
}
