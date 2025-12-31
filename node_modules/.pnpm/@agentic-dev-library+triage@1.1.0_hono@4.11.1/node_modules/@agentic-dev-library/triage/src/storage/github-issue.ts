/**
 * GitHub Issue Storage
 *
 * Stores queue state in a GitHub Issue body with:
 * - JSON state in code block between markers
 * - Human-readable status table
 * - Distributed locking via issue comments
 */

import type { QueueItem, QueueLock, QueueState } from '../queue/types.js';
import type { QueueStorage } from './interface.js';

export interface GitHubIssueStorageOptions {
    /** Repository in format "owner/repo" */
    repo: string;
    /** Issue number, or 'auto' to create if doesn't exist */
    issueNumber: number | 'auto';
    /** Issue title when auto-creating */
    issueTitle?: string;
    /** GitHub token for authentication */
    token: string;
    /** Optional Octokit instance (for testing) */
    octokit?: GitHubIssueStorageOctokit;
}

/**
 * Minimal Octokit interface for GitHub operations
 * Allows dependency injection for testing
 */
export interface GitHubIssueStorageOctokit {
    rest: {
        issues: {
            get(params: { owner: string; repo: string; issue_number: number }): Promise<{
                data: { body: string | null; number: number };
            }>;
            create(params: {
                owner: string;
                repo: string;
                title: string;
                body: string;
                labels?: string[];
            }): Promise<{ data: { number: number } }>;
            update(params: { owner: string; repo: string; issue_number: number; body: string }): Promise<unknown>;
            listComments(params: {
                owner: string;
                repo: string;
                issue_number: number;
                per_page?: number;
            }): Promise<{ data: Array<{ id: number; body?: string; created_at: string }> }>;
            createComment(params: {
                owner: string;
                repo: string;
                issue_number: number;
                body: string;
            }): Promise<{ data: { id: number } }>;
            deleteComment(params: { owner: string; repo: string; comment_id: number }): Promise<unknown>;
        };
    };
}

const STATE_START = '<!-- QUEUE_STATE_START -->';
const STATE_END = '<!-- QUEUE_STATE_END -->';
const LOCK_COMMENT_PREFIX = '🔒 QUEUE_LOCK:';

/**
 * GitHub Issue storage implementation
 */
export class GitHubIssueStorage<T extends QueueItem = QueueItem> implements QueueStorage<T> {
    private owner: string;
    private repoName: string;
    private issueNumber: number | 'auto';
    private issueTitle: string;
    private token: string;
    private octokit: GitHubIssueStorageOctokit | null;
    private actualIssueNumber: number | null = null;
    private octokitPromise: Promise<GitHubIssueStorageOctokit> | null = null;

    constructor(options: GitHubIssueStorageOptions) {
        const [owner, repo] = options.repo.split('/');
        if (!owner || !repo) {
            throw new Error('Invalid repo format. Expected "owner/repo"');
        }

        this.owner = owner;
        this.repoName = repo;
        this.issueNumber = options.issueNumber;
        this.issueTitle = options.issueTitle || 'Merge Queue State';
        this.token = options.token;
        this.octokit = options.octokit || null;
    }

    async read(): Promise<QueueState<T>> {
        const issue = await this.getOrCreateIssue();
        const body = issue.body || '';

        const parsed = this.parseIssueBody(body);
        if (parsed) {
            return parsed;
        }

        // No state found, return empty state
        return this.createEmptyState();
    }

    async write(state: QueueState<T>): Promise<void> {
        const issue = await this.getOrCreateIssue();

        const updatedState = {
            ...state,
            updatedAt: new Date().toISOString(),
        };

        const body = this.formatIssueBody(updatedState);

        const client = await this.getOctokit();
        await client.rest.issues.update({
            owner: this.owner,
            repo: this.repoName,
            issue_number: issue.number,
            body,
        });
    }

    async acquireLock(holder: string, ttlMs: number): Promise<boolean> {
        const issue = await this.getOrCreateIssue();
        const client = await this.getOctokit();

        // Check existing lock comments
        const comments = await client.rest.issues.listComments({
            owner: this.owner,
            repo: this.repoName,
            issue_number: issue.number,
            per_page: 100,
        });

        const lockComments = comments.data.filter((c) => c.body?.startsWith(LOCK_COMMENT_PREFIX));

        // Check if there's an active lock
        for (const comment of lockComments) {
            const lock = this.parseLockComment(comment.body || '');
            if (lock && new Date(lock.expiresAt) > new Date()) {
                // Lock is still valid
                return lock.holder === holder;
            }
            // Delete expired lock comment
            await client.rest.issues.deleteComment({
                owner: this.owner,
                repo: this.repoName,
                comment_id: comment.id,
            });
        }

        // Acquire new lock
        const lock: QueueLock = {
            holder,
            acquiredAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + ttlMs).toISOString(),
        };

        await client.rest.issues.createComment({
            owner: this.owner,
            repo: this.repoName,
            issue_number: issue.number,
            body: `${LOCK_COMMENT_PREFIX} ${JSON.stringify(lock)}`,
        });

        return true;
    }

    async releaseLock(holder: string): Promise<void> {
        const issue = await this.getOrCreateIssue();
        const client = await this.getOctokit();

        const comments = await client.rest.issues.listComments({
            owner: this.owner,
            repo: this.repoName,
            issue_number: issue.number,
            per_page: 100,
        });

        for (const comment of comments.data) {
            if (comment.body?.startsWith(LOCK_COMMENT_PREFIX)) {
                const lock = this.parseLockComment(comment.body);
                if (lock?.holder === holder) {
                    await client.rest.issues.deleteComment({
                        owner: this.owner,
                        repo: this.repoName,
                        comment_id: comment.id,
                    });
                }
            }
        }
    }

    async isLocked(): Promise<boolean> {
        const lock = await this.getLock();
        return lock !== null && new Date(lock.expiresAt) > new Date();
    }

    async getLock(): Promise<QueueLock | null> {
        const issue = await this.getOrCreateIssue();
        const client = await this.getOctokit();

        const comments = await client.rest.issues.listComments({
            owner: this.owner,
            repo: this.repoName,
            issue_number: issue.number,
            per_page: 100,
        });

        for (const comment of comments.data) {
            if (comment.body?.startsWith(LOCK_COMMENT_PREFIX)) {
                const lock = this.parseLockComment(comment.body);
                if (lock && new Date(lock.expiresAt) > new Date()) {
                    return lock;
                }
            }
        }

        return null;
    }

    // ============================================================================
    // Private Helpers
    // ============================================================================

    private async getOctokit(): Promise<GitHubIssueStorageOctokit> {
        if (this.octokit) {
            return this.octokit;
        }

        // Cache the import promise to avoid multiple imports
        if (!this.octokitPromise) {
            this.octokitPromise = import('octokit').then(({ Octokit }) => {
                const client = new Octokit({ auth: this.token }) as unknown as GitHubIssueStorageOctokit;
                this.octokit = client;
                return client;
            });
        }

        return this.octokitPromise;
    }

    private async getOrCreateIssue(): Promise<{ number: number; body: string | null }> {
        if (this.actualIssueNumber !== null) {
            const client = await this.getOctokit();
            const { data } = await client.rest.issues.get({
                owner: this.owner,
                repo: this.repoName,
                issue_number: this.actualIssueNumber,
            });
            return data;
        }

        if (this.issueNumber === 'auto') {
            return this.createIssue();
        }

        const client = await this.getOctokit();
        const { data } = await client.rest.issues.get({
            owner: this.owner,
            repo: this.repoName,
            issue_number: this.issueNumber,
        });
        this.actualIssueNumber = data.number;
        return data;
    }

    private async createIssue(): Promise<{ number: number; body: string | null }> {
        const client = await this.getOctokit();
        const emptyState = this.createEmptyState();
        const body = this.formatIssueBody(emptyState);

        const { data } = await client.rest.issues.create({
            owner: this.owner,
            repo: this.repoName,
            title: this.issueTitle,
            body,
            labels: ['queue', 'automation'],
        });

        this.actualIssueNumber = data.number;
        return { number: data.number, body };
    }

    private parseIssueBody(body: string): QueueState<T> | null {
        const startIdx = body.indexOf(STATE_START);
        const endIdx = body.indexOf(STATE_END);

        if (startIdx === -1 || endIdx === -1) {
            return null;
        }

        const jsonBlock = body.substring(startIdx + STATE_START.length, endIdx);
        const match = jsonBlock.match(/```json\s*([\s\S]*?)\s*```/);

        if (!match || !match[1]) {
            return null;
        }

        try {
            return JSON.parse(match[1]);
        } catch {
            return null;
        }
    }

    private formatIssueBody(state: QueueState<T>): string {
        const json = JSON.stringify(state, null, 2);

        // Build status table
        const rows = state.items.map((item, idx) => this.formatTableRow(item, idx));

        const table =
            rows.length > 0
                ? `| # | PR | Priority | Status |
|---|-----|----------|--------|
${rows.join('\n')}`
                : '_Queue is empty_';

        return `${STATE_START}
\`\`\`json
${json}
\`\`\`
${STATE_END}

## Queue Status

${table}

**Stats:**
- Total: ${state.stats.total}
- Pending: ${state.stats.byStatus.pending}
- Processing: ${state.stats.byStatus.processing}
- Failed: ${state.stats.byStatus.failed}

_Last updated: ${state.updatedAt}_
`;
    }

    private formatTableRow(item: T, idx: number): string {
        const prLink = item.id.includes('#')
            ? `[${item.id}](https://github.com/${item.id.replace('#', '/pull/')})`
            : item.id;
        const priorityEmoji = this.getPriorityEmoji(item.priority);
        const statusEmoji = this.getStatusEmoji(item.status);

        return `| ${idx + 1} | ${prLink} | ${priorityEmoji} ${item.priority} | ${statusEmoji} ${item.status} |`;
    }

    private getPriorityEmoji(priority: number): string {
        if (priority === 1) return '🔴';
        if (priority === 2) return '🟡';
        return '🟢';
    }

    private getStatusEmoji(status: string): string {
        switch (status) {
            case 'pending':
                return '⏳';
            case 'processing':
                return '🔄';
            case 'completed':
                return '✅';
            case 'failed':
                return '❌';
            default:
                return '⏸️';
        }
    }

    private parseLockComment(body: string): QueueLock | null {
        if (!body.startsWith(LOCK_COMMENT_PREFIX)) {
            return null;
        }

        const jsonStr = body.substring(LOCK_COMMENT_PREFIX.length).trim();
        try {
            return JSON.parse(jsonStr);
        } catch {
            return null;
        }
    }

    private createEmptyState(): QueueState<T> {
        return {
            version: 2,
            updatedAt: new Date().toISOString(),
            lock: null,
            items: [],
            stats: {
                total: 0,
                byStatus: { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 },
                completed24h: 0,
                failed24h: 0,
                avgProcessingTime: 0,
            },
        };
    }
}
