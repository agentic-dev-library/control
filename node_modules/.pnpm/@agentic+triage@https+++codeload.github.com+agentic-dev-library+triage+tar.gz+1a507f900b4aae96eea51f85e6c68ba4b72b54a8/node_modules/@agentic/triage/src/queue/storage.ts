/**
 * Queue Storage Interface
 *
 * Abstract interface for queue persistence.
 * Implementations can use GitHub Issues, Redis, Files, etc.
 */

import type { QueueItem, QueueLock, QueueState } from './types.js';

/**
 * Storage backend interface
 * Implement this for your preferred storage (GitHub Issue, Redis, etc.)
 */
export interface QueueStorage<T extends QueueItem = QueueItem> {
    /**
     * Read the current queue state
     */
    read(): Promise<QueueState<T>>;

    /**
     * Write the queue state
     */
    write(state: QueueState<T>): Promise<void>;

    /**
     * Acquire a distributed lock
     * @param holder - Identifier for the lock holder
     * @param ttlMs - Time-to-live in milliseconds
     * @returns true if lock acquired, false if already locked
     */
    acquireLock(holder: string, ttlMs: number): Promise<boolean>;

    /**
     * Release a distributed lock
     * @param holder - Must match the holder that acquired the lock
     */
    releaseLock(holder: string): Promise<void>;

    /**
     * Check if a lock is currently held
     */
    isLocked(): Promise<boolean>;

    /**
     * Get the current lock info
     */
    getLock(): Promise<QueueLock | null>;
}

/**
 * In-memory storage for testing
 */
export class MemoryStorage<T extends QueueItem = QueueItem> implements QueueStorage<T> {
    private state: QueueState<T>;

    constructor(initial?: Partial<QueueState<T>>) {
        this.state = {
            version: 1,
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
