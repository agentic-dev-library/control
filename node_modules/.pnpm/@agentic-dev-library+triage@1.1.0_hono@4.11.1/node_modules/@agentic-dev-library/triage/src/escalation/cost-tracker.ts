/**
 * Cost Tracker for Cloud Agents
 *
 * Tracks and enforces daily budget limits for expensive cloud agents.
 * Provides reporting and alerting when approaching budget limits.
 */

/**
 * Cost entry for tracking individual operations
 */
export interface CostEntry {
    /** Timestamp of the operation */
    timestamp: string;
    /** Task ID associated with the cost */
    taskId: string;
    /** Agent that incurred the cost */
    agent: string;
    /** Cost in cents */
    amount: number;
    /** Operation description */
    description: string;
}

/**
 * Daily cost statistics
 */
export interface DailyCostStats {
    /** Date (YYYY-MM-DD) */
    date: string;
    /** Total cost in cents */
    total: number;
    /** Number of operations */
    operations: number;
    /** Cost by agent */
    byAgent: Record<string, number>;
    /** Cost entries */
    entries: CostEntry[];
}

/**
 * Cost tracker for managing cloud agent budgets
 */
export class CostTracker {
    private entries: Map<string, CostEntry[]> = new Map();
    private dailyBudget: number;
    private onBudgetWarning?: (remaining: number, total: number) => void;

    constructor(
        dailyBudget: number,
        options?: {
            onBudgetWarning?: (remaining: number, total: number) => void;
        }
    ) {
        this.dailyBudget = dailyBudget;
        this.onBudgetWarning = options?.onBudgetWarning;
    }

    /**
     * Record a cost entry
     */
    record(taskId: string, agent: string, amount: number, description = 'Cloud agent operation'): CostEntry {
        const entry: CostEntry = {
            timestamp: new Date().toISOString(),
            taskId,
            agent,
            amount,
            description,
        };

        const today = this.getToday();
        const dailyEntries = this.entries.get(today) || [];
        dailyEntries.push(entry);
        this.entries.set(today, dailyEntries);

        // Check if approaching budget
        const stats = this.getDailyStats(today);
        const remaining = this.dailyBudget - stats.total;

        if (remaining <= this.dailyBudget * 0.2 && remaining > 0 && this.onBudgetWarning) {
            this.onBudgetWarning(remaining, stats.total);
        }

        return entry;
    }

    /**
     * Check if operation is within budget
     */
    canAfford(amount: number, date?: string): boolean {
        if (this.dailyBudget === 0) return false; // Budget of 0 means no cloud agents
        const today = date || this.getToday();
        const stats = this.getDailyStats(today);
        return stats.total + amount <= this.dailyBudget;
    }

    /**
     * Get remaining budget for today
     */
    getRemainingBudget(date?: string): number {
        const today = date || this.getToday();
        const stats = this.getDailyStats(today);
        return Math.max(0, this.dailyBudget - stats.total);
    }

    /**
     * Get daily statistics
     */
    getDailyStats(date?: string): DailyCostStats {
        const today = date || this.getToday();
        const entries = this.entries.get(today) || [];

        const byAgent: Record<string, number> = {};
        let total = 0;

        for (const entry of entries) {
            total += entry.amount;
            byAgent[entry.agent] = (byAgent[entry.agent] || 0) + entry.amount;
        }

        return {
            date: today,
            total,
            operations: entries.length,
            byAgent,
            entries: [...entries],
        };
    }

    /**
     * Get stats for a date range
     */
    getStatsInRange(startDate: string, endDate: string): DailyCostStats[] {
        const stats: DailyCostStats[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            if (this.entries.has(dateStr)) {
                stats.push(this.getDailyStats(dateStr));
            }
        }

        return stats;
    }

    /**
     * Get all-time total cost
     */
    getTotalCost(): number {
        let total = 0;
        const values = Array.from(this.entries.values());
        for (const entries of values) {
            total += entries.reduce((sum, e) => sum + e.amount, 0);
        }
        return total;
    }

    /**
     * Clear old entries (keep last N days)
     */
    cleanup(keepDays = 30): void {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - keepDays);
        const cutoffStr = cutoff.toISOString().split('T')[0];

        const dates = Array.from(this.entries.keys());
        for (const date of dates) {
            if (date < cutoffStr) {
                this.entries.delete(date);
            }
        }
    }

    /**
     * Export all data (for persistence)
     */
    export(): Record<string, CostEntry[]> {
        const exported: Record<string, CostEntry[]> = {};
        const entries = Array.from(this.entries.entries());
        for (const [date, entriesArray] of entries) {
            exported[date] = [...entriesArray];
        }
        return exported;
    }

    /**
     * Import data (from persistence)
     */
    import(data: Record<string, CostEntry[]>): void {
        this.entries.clear();
        for (const [date, entries] of Object.entries(data)) {
            this.entries.set(date, [...entries]);
        }
    }

    /**
     * Reset all tracking data
     */
    reset(): void {
        this.entries.clear();
    }

    /**
     * Update daily budget
     */
    setDailyBudget(budget: number): void {
        this.dailyBudget = budget;
    }

    /**
     * Get current daily budget
     */
    getDailyBudget(): number {
        return this.dailyBudget;
    }

    private getToday(): string {
        return new Date().toISOString().split('T')[0];
    }
}
