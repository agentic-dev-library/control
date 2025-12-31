import type { GitHubClient } from '../github/client.js';
import type { ActionResult, TriageResult } from './types.js';
export interface ResolverConfig {
    workingDirectory: string;
    dryRun?: boolean;
}
export declare class Resolver {
    private model;
    private config;
    private git;
    constructor(config: ResolverConfig);
    resolveBlockers(github: GitHubClient, triage: TriageResult): Promise<ActionResult[]>;
    resolveFeedback(github: GitHubClient, triage: TriageResult): Promise<ActionResult[]>;
    private resolveBlocker;
    private fixCIFailure;
    private resolveFeedbackItem;
    private applySuggestion;
    private generateResponse;
    private applyFix;
    private postJustification;
    commitAndPush(message: string): Promise<ActionResult>;
    /**
     * Get current git status
     */
    getStatus(): Promise<{
        modified: string[];
        staged: string[];
        untracked: string[];
    }>;
    /**
     * Get diff for files
     */
    getDiff(staged?: boolean): Promise<string>;
}
//# sourceMappingURL=resolver.d.ts.map