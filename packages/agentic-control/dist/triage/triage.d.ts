import { type GitHubConfig } from '../github/client.js';
import { type ResolverConfig } from './resolver.js';
import type { ActionResult, ResolutionPlan, TriageResult } from './types.js';
export interface TriageConfig {
    github: GitHubConfig;
    resolver: ResolverConfig;
}
export declare class Triage {
    private github;
    private analyzer;
    private resolver;
    constructor(config: TriageConfig);
    /**
     * Analyze a PR and return its current triage status
     */
    analyze(prNumber: number): Promise<TriageResult>;
    /**
     * Resolve all auto-resolvable blockers and feedback
     */
    resolve(prNumber: number): Promise<{
        triage: TriageResult;
        actions: ActionResult[];
    }>;
    /**
     * Generate a plan for resolving all issues without executing
     */
    plan(prNumber: number): Promise<ResolutionPlan>;
    /**
     * Run the full workflow until PR is ready to merge
     */
    runUntilReady(prNumber: number, options?: {
        maxIterations?: number;
        onProgress?: (triage: TriageResult, iteration: number) => void;
    }): Promise<{
        success: boolean;
        finalTriage: TriageResult;
        iterations: number;
        allActions: ActionResult[];
    }>;
    private waitForCI;
    requestReviews(prNumber: number): Promise<void>;
    formatTriageReport(triage: TriageResult): string;
}
//# sourceMappingURL=triage.d.ts.map