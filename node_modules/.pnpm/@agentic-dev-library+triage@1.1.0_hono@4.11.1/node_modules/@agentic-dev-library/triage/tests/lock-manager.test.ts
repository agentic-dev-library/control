import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LockManager } from '../src/queue/lock.js';
import type { QueueItem } from '../src/queue/types.js';
import { MemoryStorage } from '../src/storage/memory.js';

describe('LockManager', () => {
    let storage: MemoryStorage<QueueItem>;
    let lockManager: LockManager<QueueItem>;

    beforeEach(() => {
        storage = new MemoryStorage();
        lockManager = new LockManager(storage, 5000);
    });

    describe('withLock', () => {
        it('should execute function with lock', async () => {
            const fn = vi.fn().mockResolvedValue('result');

            const result = await lockManager.withLock('holder1', fn);

            expect(result).toBe('result');
            expect(fn).toHaveBeenCalledTimes(1);

            // Lock should be released after execution
            expect(await storage.isLocked()).toBe(false);
        });

        it('should release lock even if function throws', async () => {
            const fn = vi.fn().mockRejectedValue(new Error('test error'));

            await expect(lockManager.withLock('holder1', fn)).rejects.toThrow('test error');

            // Lock should still be released
            expect(await storage.isLocked()).toBe(false);
        });

        it('should throw if lock cannot be acquired', async () => {
            // Acquire lock externally
            await storage.acquireLock('other', 60000);

            const fn = vi.fn();

            await expect(lockManager.withLock('holder1', fn)).rejects.toThrow('Failed to acquire lock');

            // Function should not be called
            expect(fn).not.toHaveBeenCalled();
        });

        it('should use custom timeout', async () => {
            const fn = vi.fn().mockResolvedValue('result');

            await lockManager.withLock('holder1', fn, 10000);

            const lock = await storage.getLock();
            expect(lock).toBeNull(); // Released after execution
        });
    });

    describe('tryWithLock', () => {
        it('should execute function and return result', async () => {
            const fn = vi.fn().mockResolvedValue('result');

            const result = await lockManager.tryWithLock('holder1', fn);

            expect(result).toBe('result');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should return null if lock cannot be acquired', async () => {
            // Acquire lock externally
            await storage.acquireLock('other', 60000);

            const fn = vi.fn();
            const result = await lockManager.tryWithLock('holder1', fn);

            expect(result).toBeNull();
            expect(fn).not.toHaveBeenCalled();
        });

        it('should release lock after execution', async () => {
            const fn = vi.fn().mockResolvedValue('result');

            await lockManager.tryWithLock('holder1', fn);

            expect(await storage.isLocked()).toBe(false);
        });

        it('should release lock even if function throws', async () => {
            const fn = vi.fn().mockRejectedValue(new Error('test error'));

            await expect(lockManager.tryWithLock('holder1', fn)).rejects.toThrow('test error');

            // Lock should still be released
            expect(await storage.isLocked()).toBe(false);
        });
    });

    describe('isLocked', () => {
        it('should return false when not locked', async () => {
            expect(await lockManager.isLocked()).toBe(false);
        });

        it('should return true when locked', async () => {
            await storage.acquireLock('holder1', 5000);
            expect(await lockManager.isLocked()).toBe(true);
        });

        it('should return false when lock expired', async () => {
            await storage.acquireLock('holder1', 50);
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(await lockManager.isLocked()).toBe(false);
        });
    });

    describe('getLockHolder', () => {
        it('should return null when not locked', async () => {
            expect(await lockManager.getLockHolder()).toBeNull();
        });

        it('should return holder when locked', async () => {
            await storage.acquireLock('holder1', 5000);
            expect(await lockManager.getLockHolder()).toBe('holder1');
        });
    });

    describe('waitForRelease', () => {
        it('should return true when lock is not held', async () => {
            const released = await lockManager.waitForRelease(1000, 100);
            expect(released).toBe(true);
        });

        it('should wait for lock to be released', async () => {
            await storage.acquireLock('holder1', 200);

            const start = Date.now();
            const released = await lockManager.waitForRelease(1000, 50);
            const duration = Date.now() - start;

            expect(released).toBe(true);
            expect(duration).toBeGreaterThanOrEqual(150); // Should wait at least until expiry
        });

        it('should timeout if lock is not released', async () => {
            await storage.acquireLock('holder1', 10000);

            const released = await lockManager.waitForRelease(500, 100);
            expect(released).toBe(false);
        });

        it('should handle manual lock release', async () => {
            await storage.acquireLock('holder1', 10000);

            // Release lock after 200ms
            setTimeout(() => storage.releaseLock('holder1'), 200);

            const released = await lockManager.waitForRelease(2000, 50);
            expect(released).toBe(true);
        });
    });
});
