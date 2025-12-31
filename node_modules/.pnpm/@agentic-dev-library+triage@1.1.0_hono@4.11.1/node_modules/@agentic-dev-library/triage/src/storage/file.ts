/**
 * File Storage
 *
 * Persists queue state to a JSON file on disk.
 * Useful for local testing and single-machine deployments.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { QueueItem, QueueLock, QueueState } from '../queue/types.js';
import type { QueueStorage } from './interface.js';

/**
 * File-based storage implementation
 */
export class FileStorage<T extends QueueItem = QueueItem> implements QueueStorage<T> {
    constructor(private readonly filePath: string) {}

    async read(): Promise<QueueState<T>> {
        try {
            const content = await readFile(this.filePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            // File doesn't exist, return empty state
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return this.createEmptyState();
            }
            throw error;
        }
    }

    async write(state: QueueState<T>): Promise<void> {
        // Ensure directory exists
        await mkdir(dirname(this.filePath), { recursive: true });

        const updatedState = {
            ...state,
            updatedAt: new Date().toISOString(),
        };

        await writeFile(this.filePath, JSON.stringify(updatedState, null, 2), 'utf-8');
    }

    async acquireLock(holder: string, ttlMs: number): Promise<boolean> {
        const state = await this.read();

        if (state.lock) {
            const expires = new Date(state.lock.expiresAt);
            if (expires > new Date()) {
                return state.lock.holder === holder;
            }
        }

        state.lock = {
            holder,
            acquiredAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + ttlMs).toISOString(),
        };

        await this.write(state);
        return true;
    }

    async releaseLock(holder: string): Promise<void> {
        const state = await this.read();

        if (state.lock?.holder === holder) {
            state.lock = null;
            await this.write(state);
        }
    }

    async isLocked(): Promise<boolean> {
        const state = await this.read();
        if (!state.lock) return false;
        return new Date(state.lock.expiresAt) > new Date();
    }

    async getLock(): Promise<QueueLock | null> {
        const state = await this.read();
        return state.lock;
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
