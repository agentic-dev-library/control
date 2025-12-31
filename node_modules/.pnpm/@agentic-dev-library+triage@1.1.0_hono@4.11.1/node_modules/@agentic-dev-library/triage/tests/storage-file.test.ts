import { existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { QueueItem } from '../src/queue/types.js';
import { FileStorage } from '../src/storage/file.js';

describe('FileStorage', () => {
    const testFile = '/tmp/queue-test.json';
    let storage: FileStorage<QueueItem>;

    beforeEach(() => {
        storage = new FileStorage(testFile);
    });

    afterEach(async () => {
        // Clean up test file
        if (existsSync(testFile)) {
            await unlink(testFile);
        }
    });

    describe('read/write', () => {
        it('should return empty state when file does not exist', async () => {
            const state = await storage.read();
            expect(state.items).toEqual([]);
            expect(state.version).toBe(2);
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

        it('should persist state across instances', async () => {
            const state = await storage.read();
            state.items.push({
                id: 'test/repo#1',
                priority: 1,
                status: 'pending',
                addedAt: new Date().toISOString(),
                retries: 0,
            });
            await storage.write(state);

            // Create new instance
            const storage2 = new FileStorage(testFile);
            const loaded = await storage2.read();

            expect(loaded.items).toHaveLength(1);
            expect(loaded.items[0].id).toBe('test/repo#1');
        });

        it('should create directory if it does not exist', async () => {
            const nestedFile = '/tmp/queue-tests/nested/file.json';
            const nestedStorage = new FileStorage(nestedFile);

            const state = await nestedStorage.read();
            state.items.push({
                id: 'test/repo#1',
                priority: 1,
                status: 'pending',
                addedAt: new Date().toISOString(),
                retries: 0,
            });

            await nestedStorage.write(state);
            expect(existsSync(nestedFile)).toBe(true);

            // Cleanup
            await unlink(nestedFile);
        });

        it('should format JSON with proper indentation', async () => {
            const state = await storage.read();
            state.items.push({
                id: 'test/repo#1',
                priority: 1,
                status: 'pending',
                addedAt: new Date().toISOString(),
                retries: 0,
            });

            await storage.write(state);

            // Read raw file content
            const { readFile } = await import('node:fs/promises');
            const content = await readFile(testFile, 'utf-8');

            expect(content).toContain('  '); // Should have indentation
            expect(JSON.parse(content)).toBeTruthy(); // Should be valid JSON
        });
    });

    describe('locking', () => {
        it('should acquire and release lock', async () => {
            const acquired = await storage.acquireLock('holder1', 5000);
            expect(acquired).toBe(true);

            const isLocked = await storage.isLocked();
            expect(isLocked).toBe(true);

            await storage.releaseLock('holder1');
            expect(await storage.isLocked()).toBe(false);
        });

        it('should persist lock in file', async () => {
            await storage.acquireLock('holder1', 5000);

            // Create new instance and check lock
            const storage2 = new FileStorage(testFile);
            const isLocked = await storage2.isLocked();

            expect(isLocked).toBe(true);

            const lock = await storage2.getLock();
            expect(lock?.holder).toBe('holder1');
        });

        it('should not acquire lock when already locked by another', async () => {
            await storage.acquireLock('holder1', 5000);

            const storage2 = new FileStorage(testFile);
            const acquired = await storage2.acquireLock('holder2', 5000);

            expect(acquired).toBe(false);
        });

        it('should allow same holder to re-acquire', async () => {
            await storage.acquireLock('holder1', 5000);
            const acquired = await storage.acquireLock('holder1', 5000);

            expect(acquired).toBe(true);
        });

        it('should expire lock after timeout', async () => {
            await storage.acquireLock('holder1', 100);

            // Wait for expiry
            await new Promise((resolve) => setTimeout(resolve, 150));

            expect(await storage.isLocked()).toBe(false);
        });
    });
});
