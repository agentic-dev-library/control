/**
 * TriageConnectors - Unified API for Issue/Project/Review Management
 *
 * Following the vendor-connectors pattern from the jbcom ecosystem,
 * this class provides cached access to all triage connectors with:
 *
 * 1. Direct TypeScript API - Use connectors directly in your code
 * 2. Vercel AI SDK Tools - Standard tools for AI agents (see tools.ts)
 *
 * Similar to how VendorConnectors provides `get_*_client()` getters,
 * TriageConnectors provides namespaced APIs for issues, projects, and reviews.
 *
 * @example
 * ```typescript
 * import { TriageConnectors } from '@strata/triage';
 *
 * // Initialize once - reads credentials from environment
 * const triage = new TriageConnectors();
 *
 * // Issue operations
 * const issues = await triage.issues.list({ status: 'open' });
 * const issue = await triage.issues.create({ title: 'Fix bug', type: 'bug' });
 * await triage.issues.update('123', { priority: 'high' });
 * await triage.issues.close('123', 'Fixed in PR #456');
 *
 * // Get ready work (no blockers)
 * const ready = await triage.issues.getReadyWork({ limit: 5 });
 *
 * // Statistics
 * const stats = await triage.issues.getStats();
 * ```
 */

import { createBestProvider, createProvider, type ProviderConfig } from '../providers/index.js';
import type {
    CreateIssueOptions,
    ListIssuesOptions,
    ProviderStats,
    ReadyWork,
    TriageIssue,
    TriageProvider,
    UpdateIssueOptions,
} from '../providers/types.js';

// =============================================================================
// Configuration
// =============================================================================

export interface TriageConnectorsConfig {
    /**
     * Provider configuration. If not provided, will auto-detect.
     * Can be a single config or multiple for different providers.
     */
    provider?: ProviderConfig;

    /**
     * Working directory for local providers (Beads)
     */
    workingDir?: string;

    /**
     * Repository for GitHub provider (owner/repo format)
     */
    repo?: string;

    /**
     * Prefer Beads over GitHub when both are available
     * @default true
     */
    preferBeads?: boolean;
}

// =============================================================================
// TriageConnectors Class
// =============================================================================

/**
 * Unified triage connector providing issue, project, and review APIs.
 *
 * This is the main entry point for programmatic triage operations.
 * For AI agent tools, see `getTriageTools()` in tools.ts.
 */
export class TriageConnectors {
    private config: TriageConnectorsConfig;
    private _provider: TriageProvider | null = null;
    private _initPromise: Promise<void> | null = null;

    /**
     * Issue operations API
     */
    public readonly issues: IssueAPI;

    /**
     * Project operations API (boards, sprints, epics)
     * @remarks Coming soon - currently returns stubs
     */
    public readonly projects: ProjectAPI;

    /**
     * Review operations API (PR feedback, comments)
     * @remarks Coming soon - currently returns stubs
     */
    public readonly reviews: ReviewAPI;

    constructor(config: TriageConnectorsConfig = {}) {
        this.config = config;

        // Initialize namespaced APIs
        this.issues = new IssueAPI(this);
        this.projects = new ProjectAPI();
        this.reviews = new ReviewAPI();
    }

    /**
     * Get or initialize the underlying provider
     */
    async getProvider(): Promise<TriageProvider> {
        if (this._provider) {
            return this._provider;
        }

        // Use promise-based locking to prevent concurrent initialization
        if (this._initPromise) {
            await this._initPromise;
            if (!this._provider) {
                throw new Error('Provider initialization failed');
            }
            return this._provider;
        }

        this._initPromise = this.initializeProvider();
        await this._initPromise;
        if (!this._provider) {
            throw new Error('Provider initialization failed');
        }
        return this._provider;
    }

    /**
     * Reconfigure the connectors with a new configuration.
     * This will reset the underlying provider.
     */
    async reconfigure(config: TriageConnectorsConfig): Promise<void> {
        this.config = config;
        this._provider = null;
        this._initPromise = null;
        await this.getProvider();
    }

    private async initializeProvider(): Promise<void> {
        if (this.config.provider) {
            this._provider = createProvider(this.config.provider);
        } else {
            this._provider = await createBestProvider({
                workingDir: this.config.workingDir,
                repo: this.config.repo,
                preferBeads: this.config.preferBeads,
            });
        }
    }

    /**
     * Get the provider name
     */
    async getProviderName(): Promise<string> {
        const provider = await this.getProvider();
        return provider.name;
    }

    /**
     * Check if the connector is ready
     */
    async isReady(): Promise<boolean> {
        try {
            const provider = await this.getProvider();
            return provider.isReady();
        } catch {
            return false;
        }
    }

    /**
     * Sync with remote (for providers that support it)
     */
    async sync(): Promise<void> {
        const provider = await this.getProvider();
        if (provider.sync) {
            await provider.sync();
        }
    }
}

// =============================================================================
// Issue API
// =============================================================================

/**
 * Issue operations API - CRUD and query operations for issues
 */
class IssueAPI {
    constructor(private connectors: TriageConnectors) {}

    /**
     * Create a new issue
     */
    async create(options: CreateIssueOptions): Promise<TriageIssue> {
        const provider = await this.connectors.getProvider();
        return provider.createIssue(options);
    }

    /**
     * Get an issue by ID
     */
    async get(id: string): Promise<TriageIssue | null> {
        const provider = await this.connectors.getProvider();
        return provider.getIssue(id);
    }

    /**
     * Update an existing issue
     */
    async update(id: string, options: UpdateIssueOptions): Promise<TriageIssue> {
        const provider = await this.connectors.getProvider();
        return provider.updateIssue(id, options);
    }

    /**
     * Close an issue
     */
    async close(id: string, reason?: string): Promise<TriageIssue> {
        const provider = await this.connectors.getProvider();
        return provider.closeIssue(id, reason);
    }

    /**
     * Reopen an issue
     */
    async reopen(id: string, reason?: string): Promise<TriageIssue> {
        const provider = await this.connectors.getProvider();
        return provider.reopenIssue(id, reason);
    }

    /**
     * Delete an issue (if supported by provider)
     */
    async delete(id: string): Promise<void> {
        const provider = await this.connectors.getProvider();
        if (provider.deleteIssue) {
            await provider.deleteIssue(id);
        } else {
            throw new Error(`Delete not supported by ${provider.name} provider`);
        }
    }

    /**
     * List issues with optional filters
     */
    async list(options?: ListIssuesOptions): Promise<TriageIssue[]> {
        const provider = await this.connectors.getProvider();
        return provider.listIssues(options);
    }

    /**
     * Search issues by text query
     */
    async search(query: string, options?: ListIssuesOptions): Promise<TriageIssue[]> {
        const provider = await this.connectors.getProvider();
        return provider.searchIssues(query, options);
    }

    /**
     * Get issues ready to work on (no blockers)
     */
    async getReadyWork(options?: { limit?: number }): Promise<ReadyWork[]> {
        const provider = await this.connectors.getProvider();
        return provider.getReadyWork(options);
    }

    /**
     * Get blocked issues
     */
    async getBlocked(): Promise<TriageIssue[]> {
        const provider = await this.connectors.getProvider();
        return provider.getBlockedIssues();
    }

    /**
     * Add labels to an issue
     */
    async addLabels(id: string, labels: string[]): Promise<void> {
        const provider = await this.connectors.getProvider();
        await provider.addLabels(id, labels);
    }

    /**
     * Remove labels from an issue
     */
    async removeLabels(id: string, labels: string[]): Promise<void> {
        const provider = await this.connectors.getProvider();
        await provider.removeLabels(id, labels);
    }

    /**
     * Get provider statistics
     */
    async getStats(): Promise<ProviderStats> {
        const provider = await this.connectors.getProvider();
        return provider.getStats();
    }
}

// =============================================================================
// Project API (Coming Soon)
// =============================================================================

/**
 * Project operations API - boards, sprints, epics
 *
 * @remarks This API is under development. Currently returns stubs.
 */
class ProjectAPI {
    /**
     * List sprints/iterations
     */
    async getSprints(): Promise<{ id: string; name: string; status: string }[]> {
        // TODO: Implement when project providers are ready
        return [];
    }

    /**
     * Get current sprint
     */
    async getCurrentSprint(): Promise<{ id: string; name: string; status: string } | null> {
        // TODO: Implement when project providers are ready
        return null;
    }

    /**
     * Get epics
     */
    async getEpics(): Promise<{ id: string; title: string; progress: number }[]> {
        // TODO: Implement when project providers are ready
        return [];
    }
}

// =============================================================================
// Review API (Coming Soon)
// =============================================================================

/**
 * Review operations API - PR feedback, comments, approvals
 *
 * @remarks This API is under development. Currently returns stubs.
 */
class ReviewAPI {
    /**
     * Get PR review comments
     */
    async getPRComments(_prNumber: number): Promise<
        {
            id: string;
            body: string;
            author: string;
            path?: string;
            line?: number;
        }[]
    > {
        // TODO: Implement using existing octokit.ts functions
        return [];
    }

    /**
     * Get unresolved feedback on a PR
     */
    async getUnresolvedFeedback(_prNumber: number): Promise<
        {
            id: string;
            body: string;
            author: string;
            type: 'comment' | 'change_request';
        }[]
    > {
        // TODO: Implement
        return [];
    }

    /**
     * Reply to a review comment
     */
    async replyToComment(_commentId: string, _body: string): Promise<void> {
        // TODO: Implement using existing octokit.ts functions
    }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Create a TriageConnectors instance with auto-detection
 *
 * @example
 * ```typescript
 * const triage = await createTriageConnectors();
 * const issues = await triage.issues.list({ status: 'open' });
 * ```
 */
export async function createTriageConnectors(config?: TriageConnectorsConfig): Promise<TriageConnectors> {
    const connectors = new TriageConnectors(config);
    // Pre-initialize the provider
    await connectors.getProvider();
    return connectors;
}
