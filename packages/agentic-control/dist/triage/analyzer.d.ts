/**
 * Analyzer - Unified AI-powered analysis
 *
 * Combines conversation analysis, PR triage, and code review into one class.
 * Supports multiple AI providers via Vercel AI SDK.
 *
 * This consolidates the former AIAnalyzer and PRAnalyzer classes.
 */
import { type ProviderOptions } from '../core/providers.js';
import type { AnalysisResult, CodeReviewResult, Conversation, TriageResult as CoreTriageResult } from '../core/types.js';
import type { CIStatus, FeedbackItem, TriageResult } from './types.js';
export interface AnalyzerOptions extends ProviderOptions {
    /** Repository for GitHub operations (required for issue creation) */
    repo?: string;
}
/**
 * Interface for GitHub client - allows dependency injection
 */
export interface GitHubClientInterface {
    getPR(prNumber: number): Promise<{
        html_url: string;
        title: string;
        merged: boolean;
        state: string;
        mergeable: boolean | null;
        mergeable_state: string;
    }>;
    getCIStatus(prNumber: number): Promise<CIStatus>;
    collectFeedback(prNumber: number): Promise<FeedbackItem[]>;
    getPRFiles(prNumber: number): Promise<Array<{
        filename: string;
    }>>;
}
export declare class Analyzer {
    private providerName;
    private model;
    private apiKey;
    private repo;
    private providerFn;
    constructor(options?: AnalyzerOptions);
    private getModel;
    /**
     * Set the repository for GitHub operations
     */
    setRepo(repo: string): void;
    /**
     * Analyze a conversation to extract completed/outstanding tasks
     */
    analyzeConversation(conversation: Conversation): Promise<AnalysisResult>;
    /**
     * Review code changes and identify issues
     */
    reviewCode(diff: string, context?: string): Promise<CodeReviewResult>;
    /**
     * Quick triage - fast assessment of what needs attention
     */
    quickTriage(input: string): Promise<CoreTriageResult>;
    /**
     * Analyze a Pull Request for triage
     */
    analyzePR(github: GitHubClientInterface, prNumber: number): Promise<TriageResult>;
    /**
     * Generate a response for feedback (fix or justification)
     */
    generateFeedbackResponse(feedback: FeedbackItem, context: {
        prTitle: string;
        files: string[];
    }): Promise<{
        type: 'fix' | 'justification';
        content: string;
    }>;
    /**
     * Create GitHub issues from analysis.
     * Always uses PR review token for consistent identity.
     */
    createIssuesFromAnalysis(analysis: AnalysisResult, options?: {
        dryRun?: boolean;
        labels?: string[];
        assignCopilot?: boolean;
        repo?: string;
    }): Promise<string[]>;
    /**
     * Generate a comprehensive assessment report
     */
    generateReport(conversation: Conversation): Promise<string>;
    private prepareConversationText;
    private analyzeFeedback;
    private identifyBlockers;
    private determineStatus;
    private generateNextActions;
    private generatePRSummary;
}
/** @deprecated Use Analyzer instead */
export { Analyzer as AIAnalyzer };
export type { AnalyzerOptions as AIAnalyzerOptions };
//# sourceMappingURL=analyzer.d.ts.map