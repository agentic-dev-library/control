import { beforeEach, describe, expect, it } from 'vitest';
import type { QueueItem, QueueState } from '../src/queue/types.js';
import { MemoryStorage } from '../src/storage/memory.js';

describe('MemoryStorage', () => {
    let storage: MemoryStorage<QueueItem>;

    beforeEach(() => {
        storage = new MemoryStorage();
    });

    describe('read/write', () => {
        it('should start with empty state', async () => {
            const state = await storage.read();
            expect(state.items).toEqual([]);
            expect(state.version).toBe(2);
            expect(state.lock).toBeNull();
        });

        it('should write and read state', async () => {
            const state = await storage.read();
            state.items.push({
                id: 'test/repo#1',
                priority: 1,
                status: 'pending',
                addedAt: new Date().toISOString(),
                retries: 0,
            });

            await storage.write(state);
            const updated = await storage.read();

            expect(updated.items).toHaveLength(1);
            expect(updated.items[0].id).toBe('test/repo#1');
        });

        it('should update timestamp on write', async () => {
            const state = await storage.read();
            const before = state.updatedAt;

            await new Promise((resolve) => setTimeout(resolve, 10));
            await storage.write(state);

            const updated = await storage.read();
            expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(new Date(before).getTime());
        });

        it('should preserve state between reads', async () => {
            const state = await storage.read();
            state.stats.total = 42;
            await storage.write(state);

            const read1 = await storage.read();
            const read2 = await storage.read();

            expect(read1.stats.total).toBe(42);
            expect(read2.stats.total).toBe(42);
        });
    });

    describe('locking', () => {
        it('should acquire lock when not locked', async () => {
            const acquired = await storage.acquireLock('holder1', 5000);
            expect(acquired).toBe(true);

            const isLocked = await storage.isLocked();
            expect(isLocked).toBe(true);
        });

        it('should not acquire lock when already locked', async () => {
            await storage.acquireLock('holder1', 5000);
            const acquired = await storage.acquireLock('holder2', 5000);

            expect(acquired).toBe(false);
        });

        it('should allow same holder to re-acquire lock', async () => {
            await storage.acquireLock('holder1', 5000);
            const acquired = await storage.acquireLock('holder1', 5000);

            expect(acquired).toBe(true);
        });

        it('should release lock', async () => {
            await storage.acquireLock('holder1', 5000);
            await storage.releaseLock('holder1');

            const isLocked = await storage.isLocked();
            expect(isLocked).toBe(false);
        });

        it('should not release lock for different holder', async () => {
            await storage.acquireLock('holder1', 5000);
            await storage.releaseLock('holder2');

            const isLocked = await storage.isLocked();
            expect(isLocked).toBe(true);
        });

        it('should expire lock after timeout', async () => {
            await storage.acquireLock('holder1', 100);

            // Immediately locked
            expect(await storage.isLocked()).toBe(true);

            // Wait for expiry
            await new Promise((resolve) => setTimeout(resolve, 150));

            expect(await storage.isLocked()).toBe(false);
        });

        it('should allow acquiring expired lock', async () => {
            await storage.acquireLock('holder1', 50);
            await new Promise((resolve) => setTimeout(resolve, 100));

            const acquired = await storage.acquireLock('holder2', 5000);
            expect(acquired).toBe(true);

            const lock = await storage.getLock();
            expect(lock?.holder).toBe('holder2');
        });

        it('should return lock info', async () => {
            await storage.acquireLock('holder1', 5000);
            const lock = await storage.getLock();

            expect(lock).toBeTruthy();
            expect(lock?.holder).toBe('holder1');
            expect(lock?.acquiredAt).toBeTruthy();
            expect(lock?.expiresAt).toBeTruthy();
        });

        it('should return null when not locked', async () => {
            const lock = await storage.getLock();
            expect(lock).toBeNull();
        });
    });

    describe('initialization', () => {
        it('should accept initial state', async () => {
            const initial: Partial<QueueState<QueueItem>> = {
                version: 2,
                items: [
                    {
                        id: 'test/repo#1',
                        priority: 1,
                        status: 'pending',
                        addedAt: new Date().toISOString(),
                        retries: 0,
                    },
                ],
            };

            const storage = new MemoryStorage(initial);
            const state = await storage.read();

            expect(state.version).toBe(2);
            expect(state.items).toHaveLength(1);
        });
    });
});
