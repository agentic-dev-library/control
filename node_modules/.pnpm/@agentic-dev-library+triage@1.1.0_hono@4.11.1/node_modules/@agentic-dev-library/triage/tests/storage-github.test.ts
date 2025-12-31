import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueueItem } from '../src/queue/types.js';
import { GitHubIssueStorage, type GitHubIssueStorageOctokit } from '../src/storage/github-issue.js';

describe('GitHubIssueStorage', () => {
    let mockOctokit: GitHubIssueStorageOctokit;
    let storage: GitHubIssueStorage<QueueItem>;

    beforeEach(() => {
        // Create mock Octokit
        mockOctokit = {
            rest: {
                issues: {
                    get: vi.fn(),
                    create: vi.fn(),
                    update: vi.fn(),
                    listComments: vi.fn(),
                    createComment: vi.fn(),
                    deleteComment: vi.fn(),
                },
            },
        };

        storage = new GitHubIssueStorage({
            repo: 'test/repo',
            issueNumber: 123,
            token: 'test-token',
            octokit: mockOctokit,
        });
    });

    describe('initialization', () => {
        it('should parse repo correctly', () => {
            expect(() => new GitHubIssueStorage({ repo: 'test/repo', issueNumber: 1, token: 'token' })).not.toThrow();
        });

        it('should throw on invalid repo format', () => {
            expect(() => new GitHubIssueStorage({ repo: 'invalid', issueNumber: 1, token: 'token' })).toThrow(
                'Invalid repo format'
            );
        });
    });

    describe('read', () => {
        it('should read empty state from issue without state', async () => {
            mockOctokit.rest.issues.get = vi.fn().mockResolvedValue({
                data: { body: 'Some content without state', number: 123 },
            });

            const state = await storage.read();
            expect(state.items).toEqual([]);
            expect(state.version).toBe(2);
        });

        it('should parse state from issue body', async () => {
            const issueBody = `<!-- QUEUE_STATE_START -->
\`\`\`json
{
  "version": 2,
  "updatedAt": "2024-01-01T00:00:00Z",
  "lock": null,
  "items": [
    {
      "id": "test/repo#1",
      "priority": 1,
      "status": "pending",
      "addedAt": "2024-01-01T00:00:00Z",
      "retries": 0
    }
  ],
  "stats": {
    "total": 1,
    "byStatus": { "pending": 1, "processing": 0, "completed": 0, "failed": 0, "cancelled": 0 },
    "completed24h": 0,
    "failed24h": 0,
    "avgProcessingTime": 0
  }
}
\`\`\`
<!-- QUEUE_STATE_END -->

## Status Table
_Queue content_`;

            mockOctokit.rest.issues.get = vi.fn().mockResolvedValue({
                data: { body: issueBody, number: 123 },
            });

            const state = await storage.read();
            expect(state.items).toHaveLength(1);
            expect(state.items[0].id).toBe('test/repo#1');
            expect(state.version).toBe(2);
        });
    });

    describe('write', () => {
        it('should format issue body correctly', async () => {
            mockOctokit.rest.issues.get = vi.fn().mockResolvedValue({
                data: { body: '', number: 123 },
            });

            const updateMock = vi.fn().mockResolvedValue({});
            mockOctokit.rest.issues.update = updateMock;

            const state = await storage.read();
            state.items.push({
                id: 'test/repo#1',
                priority: 1,
                status: 'pending',
                addedAt: '2024-01-01T00:00:00Z',
                retries: 0,
            });

            await storage.write(state);

            expect(updateMock).toHaveBeenCalledTimes(1);
            const callArgs = updateMock.mock.calls[0][0];
            expect(callArgs.body).toContain('<!-- QUEUE_STATE_START -->');
            expect(callArgs.body).toContain('<!-- QUEUE_STATE_END -->');
            expect(callArgs.body).toContain('```json');
            expect(callArgs.body).toContain('## Queue Status');
        });

        it('should include status table with proper formatting', async () => {
            mockOctokit.rest.issues.get = vi.fn().mockResolvedValue({
                data: { body: '', number: 123 },
            });

            const updateMock = vi.fn().mockResolvedValue({});
            mockOctokit.rest.issues.update = updateMock;

            const state = await storage.read();
            state.items.push({
                id: 'test/repo#1',
                priority: 1,
                status: 'pending',
                addedAt: '2024-01-01T00:00:00Z',
                retries: 0,
            });

            await storage.write(state);

            const body = updateMock.mock.calls[0][0].body;
            expect(body).toContain('| # | PR | Priority | Status |');
            expect(body).toContain('test/repo#1');
            expect(body).toContain('🔴'); // Critical priority emoji
            expect(body).toContain('⏳'); // Pending status emoji
        });

        it('should show empty message when queue is empty', async () => {
            mockOctokit.rest.issues.get = vi.fn().mockResolvedValue({
                data: { body: '', number: 123 },
            });

            const updateMock = vi.fn().mockResolvedValue({});
            mockOctokit.rest.issues.update = updateMock;

            const state = await storage.read();
            await storage.write(state);

            const body = updateMock.mock.calls[0][0].body;
            expect(body).toContain('_Queue is empty_');
        });
    });

    describe('locking via comments', () => {
        it('should acquire lock via comment', async () => {
            mockOctokit.rest.issues.get = vi.fn().mockResolvedValue({
                data: { body: '', number: 123 },
            });

            mockOctokit.rest.issues.listComments = vi.fn().mockResolvedValue({
                data: [],
            });

            const createCommentMock = vi.fn().mockResolvedValue({
                data: { id: 456 },
            });
            mockOctokit.rest.issues.createComment = createCommentMock;

            const acquired = await storage.acquireLock('holder1', 5000);

            expect(acquired).toBe(true);
            expect(createCommentMock).toHaveBeenCalledTimes(1);
            const comment = createCommentMock.mock.calls[0][0];
            expect(comment.body).toContain('🔒 QUEUE_LOCK:');
            expect(comment.body).toContain('"holder":"holder1"');
        });

        it('should not acquire lock when already locked', async () => {
            mockOctokit.rest.issues.get = vi.fn().mockResolvedValue({
                data: { body: '', number: 123 },
            });

            const futureTime = new Date(Date.now() + 60000).toISOString();
            mockOctokit.rest.issues.listComments = vi.fn().mockResolvedValue({
                data: [
                    {
                        id: 456,
                        body: `🔒 QUEUE_LOCK: {"holder":"holder1","acquiredAt":"${new Date().toISOString()}","expiresAt":"${futureTime}"}`,
                        created_at: new Date().toISOString(),
                    },
                ],
            });

            const createCommentMock = vi.fn();
            mockOctokit.rest.issues.createComment = createCommentMock;

            const acquired = await storage.acquireLock('holder2', 5000);

            expect(acquired).toBe(false);
            expect(createCommentMock).not.toHaveBeenCalled();
        });

        it('should allow same holder to re-acquire lock', async () => {
            mockOctokit.rest.issues.get = vi.fn().mockResolvedValue({
                data: { body: '', number: 123 },
            });

            const futureTime = new Date(Date.now() + 60000).toISOString();
            mockOctokit.rest.issues.listComments = vi.fn().mockResolvedValue({
                data: [
                    {
                        id: 456,
                        body: `🔒 QUEUE_LOCK: {"holder":"holder1","acquiredAt":"${new Date().toISOString()}","expiresAt":"${futureTime}"}`,
                        created_at: new Date().toISOString(),
                    },
                ],
            });

            const acquired = await storage.acquireLock('holder1', 5000);
            expect(acquired).toBe(true);
        });

        it('should delete expired lock comments and acquire new lock', async () => {
            mockOctokit.rest.issues.get = vi.fn().mockResolvedValue({
                data: { body: '', number: 123 },
            });

            const pastTime = new Date(Date.now() - 1000).toISOString();
            mockOctokit.rest.issues.listComments = vi.fn().mockResolvedValue({
                data: [
                    {
                        id: 456,
                        body: `🔒 QUEUE_LOCK: {"holder":"holder1","acquiredAt":"${pastTime}","expiresAt":"${pastTime}"}`,
                        created_at: pastTime,
                    },
                ],
            });

            const deleteCommentMock = vi.fn().mockResolvedValue({});
            const createCommentMock = vi.fn().mockResolvedValue({ data: { id: 789 } });
            mockOctokit.rest.issues.deleteComment = deleteCommentMock;
            mockOctokit.rest.issues.createComment = createCommentMock;

            const acquired = await storage.acquireLock('holder2', 5000);

            expect(acquired).toBe(true);
            expect(deleteCommentMock).toHaveBeenCalledTimes(1);
            expect(createCommentMock).toHaveBeenCalledTimes(1);
        });

        it('should release lock by deleting comment', async () => {
            mockOctokit.rest.issues.get = vi.fn().mockResolvedValue({
                data: { body: '', number: 123 },
            });

            const futureTime = new Date(Date.now() + 60000).toISOString();
            mockOctokit.rest.issues.listComments = vi.fn().mockResolvedValue({
                data: [
                    {
                        id: 456,
                        body: `🔒 QUEUE_LOCK: {"holder":"holder1","acquiredAt":"${new Date().toISOString()}","expiresAt":"${futureTime}"}`,
                        created_at: new Date().toISOString(),
                    },
                ],
            });

            const deleteCommentMock = vi.fn().mockResolvedValue({});
            mockOctokit.rest.issues.deleteComment = deleteCommentMock;

            await storage.releaseLock('holder1');

            expect(deleteCommentMock).toHaveBeenCalledTimes(1);
            expect(deleteCommentMock).toHaveBeenCalledWith({
                owner: 'test',
                repo: 'repo',
                comment_id: 456,
            });
        });

        it('should not release lock for different holder', async () => {
            mockOctokit.rest.issues.get = vi.fn().mockResolvedValue({
                data: { body: '', number: 123 },
            });

            const futureTime = new Date(Date.now() + 60000).toISOString();
            mockOctokit.rest.issues.listComments = vi.fn().mockResolvedValue({
                data: [
                    {
                        id: 456,
                        body: `🔒 QUEUE_LOCK: {"holder":"holder1","acquiredAt":"${new Date().toISOString()}","expiresAt":"${futureTime}"}`,
                        created_at: new Date().toISOString(),
                    },
                ],
            });

            const deleteCommentMock = vi.fn();
            mockOctokit.rest.issues.deleteComment = deleteCommentMock;

            await storage.releaseLock('holder2');

            expect(deleteCommentMock).not.toHaveBeenCalled();
        });
    });

    describe('auto-create issue', () => {
        it('should create issue when issueNumber is "auto"', async () => {
            const storage = new GitHubIssueStorage({
                repo: 'test/repo',
                issueNumber: 'auto',
                issueTitle: 'Test Queue',
                token: 'test-token',
                octokit: mockOctokit,
            });

            const createMock = vi.fn().mockResolvedValue({
                data: { number: 999 },
            });
            mockOctokit.rest.issues.create = createMock;
            mockOctokit.rest.issues.get = vi.fn().mockResolvedValue({
                data: { body: '', number: 999 },
            });

            await storage.read();

            expect(createMock).toHaveBeenCalledTimes(1);
            const callArgs = createMock.mock.calls[0][0];
            expect(callArgs.title).toBe('Test Queue');
            expect(callArgs.labels).toContain('queue');
            expect(callArgs.labels).toContain('automation');
        });
    });
});
