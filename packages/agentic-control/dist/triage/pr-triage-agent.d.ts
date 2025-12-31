/**
 * PR Triage Agent
 *
 * Specialized agent for triaging and resolving Pull Requests.
 * Combines MCP tools with AI analysis to:
 * - Analyze PR state and feedback
 * - Identify and fix blockers
 * - Address reviewer comments
 * - Ensure CI passes
 * - Prepare PRs for merge
 */
import { z } from 'zod';
import { type AgentConfig, type AgentResult } from './agent.js';
declare const FeedbackItemSchema: z.ZodObject<{
    id: z.ZodString;
    source: z.ZodString;
    severity: z.ZodEnum<{
        critical: "critical";
        high: "high";
        medium: "medium";
        low: "low";
        suggestion: "suggestion";
    }>;
    category: z.ZodEnum<{
        bug: "bug";
        security: "security";
        performance: "performance";
        documentation: "documentation";
        style: "style";
        suggestion: "suggestion";
        question: "question";
    }>;
    file: z.ZodOptional<z.ZodString>;
    line: z.ZodOptional<z.ZodNumber>;
    content: z.ZodString;
    suggestion: z.ZodOptional<z.ZodString>;
    addressed: z.ZodBoolean;
    addressedBy: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
declare const PRAnalysisSchema: z.ZodObject<{
    prNumber: z.ZodNumber;
    prUrl: z.ZodString;
    prTitle: z.ZodString;
    status: z.ZodEnum<{
        blocked: "blocked";
        needs_work: "needs_work";
        ready: "ready";
        waiting_ci: "waiting_ci";
        waiting_review: "waiting_review";
    }>;
    ci: z.ZodObject<{
        status: z.ZodEnum<{
            pending: "pending";
            unknown: "unknown";
            passing: "passing";
            failing: "failing";
        }>;
        checks: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            status: z.ZodEnum<{
                pending: "pending";
                success: "success";
                failure: "failure";
                skipped: "skipped";
            }>;
            url: z.ZodOptional<z.ZodString>;
            summary: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        failureReasons: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    feedback: z.ZodObject<{
        total: z.ZodNumber;
        unaddressed: z.ZodNumber;
        critical: z.ZodNumber;
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            source: z.ZodString;
            severity: z.ZodEnum<{
                critical: "critical";
                high: "high";
                medium: "medium";
                low: "low";
                suggestion: "suggestion";
            }>;
            category: z.ZodEnum<{
                bug: "bug";
                security: "security";
                performance: "performance";
                documentation: "documentation";
                style: "style";
                suggestion: "suggestion";
                question: "question";
            }>;
            file: z.ZodOptional<z.ZodString>;
            line: z.ZodOptional<z.ZodNumber>;
            content: z.ZodString;
            suggestion: z.ZodOptional<z.ZodString>;
            addressed: z.ZodBoolean;
            addressedBy: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    blockers: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            other: "other";
            ci_failure: "ci_failure";
            merge_conflict: "merge_conflict";
            missing_approval: "missing_approval";
            unaddressed_feedback: "unaddressed_feedback";
        }>;
        description: z.ZodString;
        autoResolvable: z.ZodBoolean;
        suggestedFix: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    summary: z.ZodString;
    nextActions: z.ZodArray<z.ZodObject<{
        action: z.ZodString;
        priority: z.ZodEnum<{
            critical: "critical";
            high: "high";
            medium: "medium";
            low: "low";
        }>;
        automated: z.ZodBoolean;
        reason: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type PRAnalysis = z.infer<typeof PRAnalysisSchema>;
export type FeedbackItem = z.infer<typeof FeedbackItemSchema>;
export interface PRTriageConfig extends AgentConfig {
    /** Repository in format owner/repo */
    repository: string;
}
export declare class PRTriageAgent {
    private config;
    private agent;
    private mcpClients;
    private initialized;
    /** Promise-based lock to prevent concurrent initialization race conditions */
    private initializationPromise;
    constructor(config: PRTriageConfig);
    /**
     * Initialize the agent and MCP clients.
     * Thread-safe: concurrent calls will wait for the same initialization to complete.
     */
    initialize(): Promise<void>;
    /**
     * Internal initialization logic - only called once due to promise lock
     */
    private doInitialize;
    close(): Promise<void>;
    /**
     * Analyze a PR and return structured analysis
     */
    analyze(prNumber: number): Promise<PRAnalysis>;
    /**
     * Generate a human-readable triage report
     */
    generateReport(prNumber: number): Promise<string>;
    /**
     * Automatically resolve all auto-resolvable issues
     */
    resolve(prNumber: number): Promise<AgentResult>;
    /**
     * Run the complete triage workflow until PR is ready
     */
    runUntilReady(prNumber: number, options?: {
        maxIterations?: number;
        requestReviews?: boolean;
        autoMerge?: boolean;
    }): Promise<{
        success: boolean;
        finalStatus: PRAnalysis['status'];
        iterations: number;
        report: string;
    }>;
    /**
     * Wait for CI to complete
     */
    private waitForCI;
    /**
     * Format analysis as a readable report
     */
    private formatReport;
}
/**
 * Convenience function for quick PR triage
 */
export declare function triagePR(repository: string, prNumber: number, options?: Partial<PRTriageConfig>): Promise<PRAnalysis>;
export {};
//# sourceMappingURL=pr-triage-agent.d.ts.map