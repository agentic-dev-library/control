/**
 * Station-to-Station Handoff Protocol
 *
 * Enables seamless agent continuity:
 * 1. Current agent completes scope of work
 * 2. Spawns successor agent (not sub-agent - its own master)
 * 3. Successor confirms health via fleet tooling
 * 4. Successor retrieves predecessor's conversation
 * 5. Successor merges predecessor's PR
 * 6. Successor opens own PR and continues work
 *
 * All configuration is user-provided - no hardcoded values.
 */
import type { HandoffOptions, HandoffResult, Result } from '../core/types.js';
export type MergeMethod = 'merge' | 'squash' | 'rebase';
export interface TakeoverOptions {
    admin?: boolean;
    auto?: boolean;
    mergeMethod?: MergeMethod;
    deleteBranch?: boolean;
}
export declare class HandoffManager {
    private api;
    private analyzer;
    private repo;
    constructor(options?: {
        cursorApiKey?: string;
        anthropicKey?: string;
        repo?: string;
    });
    /**
     * Set the repository for GitHub operations
     */
    setRepo(repo: string): void;
    /**
     * Initiate handoff to successor agent
     */
    initiateHandoff(predecessorId: string, options: HandoffOptions): Promise<HandoffResult>;
    /**
     * Called by successor to confirm health
     */
    confirmHealthAndBegin(successorId: string, predecessorId: string): Promise<void>;
    /**
     * Called by successor to merge predecessor and take over
     */
    takeover(predecessorId: string, predecessorPr: number, newBranchName: string, options?: TakeoverOptions): Promise<Result<void>>;
    /**
     * Build successor prompt
     */
    private buildSuccessorPrompt;
    /**
     * Wait for health check from successor
     */
    private waitForHealthCheck;
}
//# sourceMappingURL=manager.d.ts.map