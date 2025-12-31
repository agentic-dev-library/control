/**
 * In-Memory Storage
 *
 * Simple in-memory storage implementation for testing.
 * State is lost when the process exits.
 */

import type { QueueItem, QueueLock, QueueState } from '../queue/types.js';
import type { QueueStorage } from './interface.js';

/**
 * In-memory storage for testing
 */
export class MemoryStorage<T extends QueueItem = QueueItem> implements QueueStorage<T> {
    private state: QueueState<T>;

    constructor(initial?: Partial<QueueState<T>>) {
        this.state = {
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
            ...initial,
        };
    }

    async read(): Promise<QueueState<T>> {
        return { ...this.state, items: [...this.state.items] };
    }

    async write(state: QueueState<T>): Promise<void> {
        this.state = { ...state, updatedAt: new Date().toISOString() };
    }

    async acquireLock(holder: string, ttlMs: number): Promise<boolean> {
        if (this.state.lock) {
            const expires = new Date(this.state.lock.expiresAt);
            if (expires > new Date()) {
                return this.state.lock.holder === holder;
            }
        }

        this.state.lock = {
            holder,
            acquiredAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + ttlMs).toISOString(),
        };
        return true;
    }

    async releaseLock(holder: string): Promise<void> {
        if (this.state.lock?.holder === holder) {
            this.state.lock = null;
        }
    }

    async isLocked(): Promise<boolean> {
        if (!this.state.lock) return false;
        return new Date(this.state.lock.expiresAt) > new Date();
    }

    async getLock(): Promise<QueueLock | null> {
        return this.state.lock;
    }
}
