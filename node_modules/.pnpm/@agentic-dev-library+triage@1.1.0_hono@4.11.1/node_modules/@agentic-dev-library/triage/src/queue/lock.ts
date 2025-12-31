/**
 * Lock Manager Utilities
 *
 * Higher-level utilities for managing distributed locks.
 */

import type { QueueStorage } from '../storage/interface.js';
import type { QueueItem } from './types.js';

/**
 * Lock manager for distributed coordination
 */
export class LockManager<T extends QueueItem = QueueItem> {
    constructor(
        private storage: QueueStorage<T>,
        private defaultTimeout = 5 * 60 * 1000 // 5 minutes
    ) {}

    /**
     * Execute a function with a lock
     * Automatically acquires and releases the lock
     */
    async withLock<R>(holder: string, fn: () => Promise<R>, timeout?: number): Promise<R> {
        const acquired = await this.storage.acquireLock(holder, timeout || this.defaultTimeout);
        if (!acquired) {
            throw new Error('Failed to acquire lock');
        }

        try {
            return await fn();
        } finally {
            await this.storage.releaseLock(holder);
        }
    }

    /**
     * Try to execute a function with a lock
     * Returns null if lock cannot be acquired
     */
    async tryWithLock<R>(holder: string, fn: () => Promise<R>, timeout?: number): Promise<R | null> {
        const acquired = await this.storage.acquireLock(holder, timeout || this.defaultTimeout);
        if (!acquired) {
            return null;
        }

        try {
            return await fn();
        } finally {
            await this.storage.releaseLock(holder);
        }
    }

    /**
     * Check if currently locked
     */
    async isLocked(): Promise<boolean> {
        return this.storage.isLocked();
    }

    /**
     * Get current lock holder
     */
    async getLockHolder(): Promise<string | null> {
        const lock = await this.storage.getLock();
        return lock?.holder || null;
    }

    /**
     * Wait for lock to be released
     * Returns true if lock was released, false if timeout
     */
    async waitForRelease(maxWaitMs = 30000, checkIntervalMs = 1000): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitMs) {
            if (!(await this.isLocked())) {
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
        }

        return false;
    }
}
