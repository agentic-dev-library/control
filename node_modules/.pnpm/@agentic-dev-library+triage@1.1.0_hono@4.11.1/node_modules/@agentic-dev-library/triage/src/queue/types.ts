/**
 * Queue Management Types
 *
 * Provider-agnostic types for managing task/merge queues.
 * Storage implementations (GitHub Issue, Redis, File, etc.)
 * are provided by @agentic/control or users.
 */

/**
 * Status of an item in the queue
 */
export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Priority levels (lower = higher priority)
 */
export type Priority = 1 | 2 | 3; // 1=critical, 2=normal, 3=low

/**
 * Base queue item interface
 */
export interface QueueItem {
    /** Unique identifier (e.g., "org/repo#123") */
    id: string;
    /** Priority level */
    priority: Priority;
    /** Current status */
    status: QueueItemStatus;
    /** When the item was added */
    addedAt: string;
    /** When processing started (if applicable) */
    startedAt?: string;
    /** When processing completed (if applicable) */
    completedAt?: string;
    /** Number of retry attempts */
    retries: number;
    /** Last error message (if failed) */
    lastError?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Queue statistics
 */
export interface QueueStats {
    /** Total items currently in queue */
    total: number;
    /** Items by status */
    byStatus: Record<QueueItemStatus, number>;
    /** Items completed in last 24h */
    completed24h: number;
    /** Items failed in last 24h */
    failed24h: number;
    /** Average processing time in minutes */
    avgProcessingTime: number;
}

/**
 * Queue state for serialization
 */
export interface QueueState<T extends QueueItem = QueueItem> {
    /** Schema version for migrations */
    version: number;
    /** Last update timestamp */
    updatedAt: string;
    /** Current lock holder (if any) */
    lock: QueueLock | null;
    /** The queue items */
    items: T[];
    /** Statistics */
    stats: QueueStats;
}

/**
 * Distributed lock for queue operations
 */
export interface QueueLock {
    /** Who holds the lock */
    holder: string;
    /** When the lock was acquired */
    acquiredAt: string;
    /** Lock expiry time */
    expiresAt: string;
}

/**
 * Activity log entry
 */
export interface QueueActivity {
    /** Timestamp */
    timestamp: string;
    /** Activity type */
    type: 'added' | 'started' | 'completed' | 'failed' | 'cancelled' | 'retried';
    /** Item ID */
    itemId: string;
    /** Additional details */
    message?: string;
}
