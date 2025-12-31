/**
 * Queue Manager
 *
 * Core queue management logic that works with any storage backend.
 * Handles priority ordering, locking, and state management.
 */

import type { QueueStorage } from './storage.js';
import type { QueueItem, QueueItemStatus, QueueState, QueueStats } from './types.js';

/**
 * Configuration for the queue manager
 */
export interface QueueManagerConfig {
    /** Lock timeout in milliseconds (default: 5 minutes) */
    lockTimeout?: number;
    /** Maximum retries before marking as failed (default: 3) */
    maxRetries?: number;
    /** Unique identifier for this manager instance */
    instanceId?: string;
}

/**
 * Queue Manager - handles all queue operations
 */
export class QueueManager<T extends QueueItem = QueueItem> {
    private config: Required<QueueManagerConfig>;

    constructor(
        private storage: QueueStorage<T>,
        config: QueueManagerConfig = {}
    ) {
        this.config = {
            lockTimeout: config.lockTimeout ?? 5 * 60 * 1000,
            maxRetries: config.maxRetries ?? 3,
            instanceId: config.instanceId ?? `manager-${Date.now()}`,
        };
    }

    /**
     * Add an item to the queue
     */
    async add(
        item: Omit<T, 'status' | 'addedAt' | 'retries'> & Partial<Pick<T, 'status' | 'addedAt' | 'retries'>>
    ): Promise<T> {
        const state = await this.storage.read();

        // Check for duplicates
        if (state.items.some((i) => i.id === item.id)) {
            throw new Error(`Item ${item.id} already in queue`);
        }

        const newItem = {
            ...item,
            status: item.status ?? 'pending',
            addedAt: item.addedAt ?? new Date().toISOString(),
            retries: item.retries ?? 0,
        } as T;

        state.items.push(newItem);
        this.sortQueue(state.items);
        this.updateStats(state);

        await this.storage.write(state);
        return newItem;
    }

    /**
     * Remove an item from the queue
     */
    async remove(id: string): Promise<T | undefined> {
        const state = await this.storage.read();
        const index = state.items.findIndex((i) => i.id === id);

        if (index === -1) return undefined;

        const [removed] = state.items.splice(index, 1);
        this.updateStats(state);
        await this.storage.write(state);

        return removed;
    }

    /**
     * Get the next item to process (highest priority, oldest first)
     */
    async next(): Promise<T | undefined> {
        const state = await this.storage.read();
        return state.items.find((i) => i.status === 'pending');
    }

    /**
     * Get an item by ID
     */
    async get(id: string): Promise<T | undefined> {
        const state = await this.storage.read();
        return state.items.find((i) => i.id === id);
    }

    /**
     * Update an item's properties
     */
    async update(id: string, updates: Partial<Omit<T, 'id'>>): Promise<T | undefined> {
        const state = await this.storage.read();
        const item = state.items.find((i) => i.id === id);

        if (!item) return undefined;

        Object.assign(item, updates);
        this.sortQueue(state.items);
        this.updateStats(state);
        await this.storage.write(state);

        return item;
    }

    /**
     * Mark an item as processing
     */
    async startProcessing(id: string): Promise<T | undefined> {
        return this.update(id, {
            status: 'processing',
            startedAt: new Date().toISOString(),
        } as Partial<T>);
    }

    /**
     * Mark an item as completed and remove from queue
     */
    async complete(id: string): Promise<T | undefined> {
        const item = await this.get(id);
        if (!item) return undefined;

        const state = await this.storage.read();
        state.items = state.items.filter((i) => i.id !== id);
        state.stats.completed24h++;
        this.updateStats(state);
        await this.storage.write(state);

        return {
            ...item,
            status: 'completed' as QueueItemStatus,
            completedAt: new Date().toISOString(),
        };
    }

    /**
     * Mark an item as failed
     * If under max retries, requeue as pending
     */
    async fail(id: string, error: string): Promise<T | undefined> {
        const state = await this.storage.read();
        const item = state.items.find((i) => i.id === id);

        if (!item) return undefined;

        item.retries++;
        item.lastError = error;

        if (item.retries >= this.config.maxRetries) {
            item.status = 'failed';
            state.stats.failed24h++;
        } else {
            item.status = 'pending';
            item.startedAt = undefined;
        }

        this.sortQueue(state.items);
        this.updateStats(state);
        await this.storage.write(state);

        return item;
    }

    /**
     * Cancel an item
     */
    async cancel(id: string): Promise<T | undefined> {
        return this.update(id, { status: 'cancelled' } as Partial<T>);
    }

    /**
     * List all items (optionally filtered by status)
     */
    async list(status?: QueueItemStatus): Promise<T[]> {
        const state = await this.storage.read();
        if (status) {
            return state.items.filter((i) => i.status === status);
        }
        return [...state.items];
    }

    /**
     * Get queue statistics
     */
    async stats(): Promise<QueueStats> {
        const state = await this.storage.read();
        return { ...state.stats };
    }

    /**
     * Get current queue length
     */
    async length(): Promise<number> {
        const state = await this.storage.read();
        return state.items.length;
    }

    /**
     * Clear all items (dangerous!)
     */
    async clear(): Promise<void> {
        const state = await this.storage.read();
        state.items = [];
        this.updateStats(state);
        await this.storage.write(state);
    }

    /**
     * Acquire a lock for processing
     */
    async lock(): Promise<boolean> {
        return this.storage.acquireLock(this.config.instanceId, this.config.lockTimeout);
    }

    /**
     * Release the lock
     */
    async unlock(): Promise<void> {
        return this.storage.releaseLock(this.config.instanceId);
    }

    /**
     * Check if queue is locked
     */
    async isLocked(): Promise<boolean> {
        return this.storage.isLocked();
    }

    /**
     * Process the next item with a handler
     * Automatically handles locking, status updates, and error handling
     */
    async processNext<R>(handler: (item: T) => Promise<R>): Promise<{ item: T; result: R } | null> {
        // Try to acquire lock
        if (!(await this.lock())) {
            return null;
        }

        try {
            const item = await this.next();
            if (!item) {
                return null;
            }

            await this.startProcessing(item.id);

            try {
                const result = await handler(item);
                await this.complete(item.id);
                return { item, result };
            } catch (error) {
                await this.fail(item.id, error instanceof Error ? error.message : String(error));
                throw error;
            }
        } finally {
            await this.unlock();
        }
    }

    // ============================================================================
    // Private Helpers
    // ============================================================================

    /**
     * Sort queue by priority (ascending) then by addedAt (ascending)
     */
    private sortQueue(items: T[]): void {
        items.sort((a, b) => {
            // Pending items first
            if (a.status !== b.status) {
                if (a.status === 'pending') return -1;
                if (b.status === 'pending') return 1;
            }
            // Then by priority (lower = higher priority)
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            // Then by added time (older first)
            return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        });
    }

    /**
     * Update queue statistics
     */
    private updateStats(state: QueueState<T>): void {
        const byStatus: Record<QueueItemStatus, number> = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            cancelled: 0,
        };

        for (const item of state.items) {
            byStatus[item.status]++;
        }

        state.stats.total = state.items.length;
        state.stats.byStatus = byStatus;
    }
}
