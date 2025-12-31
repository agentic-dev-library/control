/**
 * Triage Provider Abstraction
 *
 * Defines common interfaces for issue tracking providers.
 * Allows agentic-triage to work with multiple backends:
 * - GitHub Issues
 * - Beads (local-first, AI-native)
 * - Jira (enterprise)
 * - Linear (modern)
 */

// =============================================================================
// Core Types
// =============================================================================

export type IssuePriority = 'critical' | 'high' | 'medium' | 'low' | 'backlog';
export type IssueStatus = 'open' | 'in_progress' | 'blocked' | 'closed';
export type IssueType = 'bug' | 'feature' | 'task' | 'epic' | 'chore';

export type DependencyType = 'blocks' | 'related' | 'parent-child' | 'discovered-from';

/**
 * Normalized issue representation across all providers
 */
export interface TriageIssue {
    /** Provider-specific ID (e.g., "123" for GitHub, "bd-a1b2" for Beads) */
    id: string;
    /** Human-readable title */
    title: string;
    /** Optional description/body */
    description?: string;
    /** Issue status */
    status: IssueStatus;
    /** Priority level */
    priority: IssuePriority;
    /** Issue type */
    type: IssueType;
    /** Labels/tags */
    labels: string[];
    /** Assignee username/identifier */
    assignee?: string;
    /** Creation timestamp (ISO 8601) */
    createdAt: string;
    /** Last update timestamp (ISO 8601) */
    updatedAt: string;
    /** Closed timestamp if applicable */
    closedAt?: string;
    /** URL to view the issue (if available) */
    url?: string;
    /** Provider-specific metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Issue dependency/link
 */
export interface IssueDependency {
    /** Source issue ID */
    from: string;
    /** Target issue ID */
    to: string;
    /** Type of dependency */
    type: DependencyType;
}

/**
 * Options for creating an issue
 */
export interface CreateIssueOptions {
    title: string;
    description?: string;
    type?: IssueType;
    priority?: IssuePriority;
    labels?: string[];
    assignee?: string;
    /** Parent issue ID for hierarchical providers */
    parentId?: string;
    /** Metadata passed to provider */
    metadata?: Record<string, unknown>;
}

/**
 * Options for updating an issue
 */
export interface UpdateIssueOptions {
    title?: string;
    description?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
    type?: IssueType;
    labels?: string[];
    assignee?: string;
    /** Reason for closing (if status = closed) */
    closeReason?: string;
    /** Metadata passed to provider */
    metadata?: Record<string, unknown>;
}

/**
 * Options for listing issues
 */
export interface ListIssuesOptions {
    /** Filter by status */
    status?: IssueStatus | IssueStatus[];
    /** Filter by priority */
    priority?: IssuePriority | IssuePriority[];
    /** Filter by type */
    type?: IssueType | IssueType[];
    /** Filter by labels (AND logic) */
    labels?: string[];
    /** Filter by any of these labels (OR logic) */
    labelsAny?: string[];
    /** Filter by assignee */
    assignee?: string;
    /** Search in title */
    titleContains?: string;
    /** Search in description */
    descriptionContains?: string;
    /** Created after date */
    createdAfter?: string;
    /** Created before date */
    createdBefore?: string;
    /** Maximum results */
    limit?: number;
    /** Sort field */
    sortBy?: 'created' | 'updated' | 'priority';
    /** Sort direction */
    sortOrder?: 'asc' | 'desc';
}

/**
 * Ready work item - issue with no blockers
 */
export interface ReadyWork {
    issue: TriageIssue;
    /** Blocking issues that are now resolved */
    resolvedBlockers?: string[];
}

/**
 * Provider statistics
 */
export interface ProviderStats {
    total: number;
    open: number;
    inProgress: number;
    blocked: number;
    closed: number;
    byPriority: Record<IssuePriority, number>;
    byType: Record<IssueType, number>;
}

// =============================================================================
// Provider Interface
// =============================================================================

/**
 * Triage Provider Interface
 *
 * All issue tracking backends must implement this interface.
 */
export interface TriageProvider {
    /** Provider name (e.g., 'github', 'beads', 'jira', 'linear') */
    readonly name: string;

    /** Provider display name */
    readonly displayName: string;

    /** Whether the provider is initialized and ready */
    isReady(): Promise<boolean>;

    // =========================================================================
    // Issue CRUD
    // =========================================================================

    /**
     * Create a new issue
     */
    createIssue(options: CreateIssueOptions): Promise<TriageIssue>;

    /**
     * Get an issue by ID
     */
    getIssue(id: string): Promise<TriageIssue | null>;

    /**
     * Update an existing issue
     */
    updateIssue(id: string, options: UpdateIssueOptions): Promise<TriageIssue>;

    /**
     * Close an issue
     */
    closeIssue(id: string, reason?: string): Promise<TriageIssue>;

    /**
     * Reopen an issue
     */
    reopenIssue(id: string, reason?: string): Promise<TriageIssue>;

    /**
     * Delete an issue (if supported)
     */
    deleteIssue?(id: string): Promise<void>;

    // =========================================================================
    // Querying
    // =========================================================================

    /**
     * List issues with optional filters
     */
    listIssues(options?: ListIssuesOptions): Promise<TriageIssue[]>;

    /**
     * Get issues ready to work on (no blockers)
     */
    getReadyWork(options?: { limit?: number; priority?: IssuePriority }): Promise<ReadyWork[]>;

    /**
     * Get blocked issues
     */
    getBlockedIssues(): Promise<TriageIssue[]>;

    /**
     * Search issues by text
     */
    searchIssues(query: string, options?: ListIssuesOptions): Promise<TriageIssue[]>;

    // =========================================================================
    // Labels
    // =========================================================================

    /**
     * Add labels to an issue
     */
    addLabels(id: string, labels: string[]): Promise<void>;

    /**
     * Remove labels from an issue
     */
    removeLabels(id: string, labels: string[]): Promise<void>;

    /**
     * Get all available labels
     */
    getAvailableLabels?(): Promise<string[]>;

    // =========================================================================
    // Statistics
    // =========================================================================

    /**
     * Get provider statistics
     */
    getStats(): Promise<ProviderStats>;

    /**
     * Sync with remote (for providers that support it)
     */
    sync?(): Promise<void>;
}

// =============================================================================
// Provider Configuration
// =============================================================================

export interface GitHubProviderConfig {
    type: 'github';
    /** Repository in owner/repo format */
    repo: string;
    /** GitHub token (defaults to GITHUB_TOKEN env var) */
    token?: string;
}

export interface BeadsProviderConfig {
    type: 'beads';
    /** Working directory (defaults to cwd) */
    workingDir?: string;
}

export interface JiraProviderConfig {
    type: 'jira';
    /** Jira instance host (e.g., 'https://mycompany.atlassian.net') */
    host: string;
    /** Project key */
    projectKey: string;
    /** API token */
    apiToken: string;
    /** User email for auth */
    email: string;
}

export type ProviderConfig = GitHubProviderConfig | BeadsProviderConfig | JiraProviderConfig;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Map provider priority strings to normalized priority
 */
export function normalizePriority(value: string): IssuePriority {
    const lower = value.toLowerCase();
    if (lower === 'critical' || lower === 'highest' || lower === 'p0') return 'critical';
    if (lower === 'high' || lower === 'p1') return 'high';
    if (lower === 'medium' || lower === 'medium' || lower === 'p2') return 'medium';
    if (lower === 'low' || lower === 'p3') return 'low';
    if (lower === 'lowest' || lower === 'backlog' || lower === 'p4') return 'backlog';
    return 'medium';
}

/**
 * Map normalized priority to numeric value (0 is highest)
 */
export function priorityToNumber(priority: IssuePriority): number {
    switch (priority) {
        case 'critical':
            return 0;
        case 'high':
            return 1;
        case 'medium':
            return 2;
        case 'low':
            return 3;
        case 'backlog':
            return 4;
    }
}

/**
 * Map provider status strings to normalized status
 */
export function normalizeStatus(value: string): IssueStatus {
    const lower = value.toLowerCase().replace(/[_-]/g, '');
    if (lower === 'open' || lower === 'new' || lower === 'todo') return 'open';
    if (lower === 'inprogress' || lower === 'active' || lower === 'doing') return 'in_progress';
    if (lower === 'blocked' || lower === 'waiting') return 'blocked';
    if (lower === 'closed' || lower === 'done' || lower === 'resolved') return 'closed';
    return 'open';
}

/**
 * Map provider type strings to normalized type
 */
export function normalizeType(value: string): IssueType {
    const lower = value.toLowerCase();
    if (lower === 'bug' || lower === 'defect') return 'bug';
    if (lower === 'feature' || lower === 'enhancement' || lower === 'story') return 'feature';
    if (lower === 'task' || lower === 'subtask') return 'task';
    if (lower === 'epic' || lower === 'initiative') return 'epic';
    if (lower === 'chore' || lower === 'maintenance') return 'chore';
    return 'task';
}
