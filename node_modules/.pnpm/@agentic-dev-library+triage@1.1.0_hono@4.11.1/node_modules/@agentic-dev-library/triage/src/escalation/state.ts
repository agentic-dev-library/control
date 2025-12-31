/**
 * Escalation State Management
 *
 * Tracks the progression of tasks through the 7-level escalation ladder.
 * Maintains attempt counts, errors, resolution status, and cost tracking.
 */

/**
 * The 7 escalation levels
 * - 0: Static Analysis (lint/tsc) - Free, instant
 * - 1: Complexity Evaluation (Ollama) - Free, routes to 2 or 3
 * - 2: Ollama Fix - Free, simple fixes
 * - 3: Jules Session - Free tier, complex work
 * - 4: Jules + Boosted Context - Free tier, more context
 * - 5: Human Review Queue - Free, awaits approval
 * - 6: Cloud Agent (Cursor) - Expensive, requires approval
 */
export type EscalationLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * State for a single task progressing through escalation levels
 */
export interface EscalationState {
    /** Unique task identifier */
    taskId: string;

    /** Current escalation level (0-6) */
    level: EscalationLevel;

    /** Attempt counts per level */
    attempts: Record<string, number>;

    /** Error messages encountered */
    errors: string[];

    /** Whether the task has been resolved */
    resolved: boolean;

    /** Total cost incurred (in cents) */
    cost: number;

    /** Timestamp when state was created */
    createdAt: string;

    /** Timestamp of last update */
    updatedAt: string;

    /** Whether human approval has been granted for cloud agents */
    approved: boolean;
}

/**
 * Manager for escalation states across multiple tasks
 */
export class EscalationStateManager {
    private states: Map<string, EscalationState> = new Map();

    /**
     * Create or get state for a task
     */
    getState(taskId: string): EscalationState {
        if (!this.states.has(taskId)) {
            const now = new Date().toISOString();
            this.states.set(taskId, {
                taskId,
                level: 0,
                attempts: {},
                errors: [],
                resolved: false,
                cost: 0,
                createdAt: now,
                updatedAt: now,
                approved: false,
            });
        }
        const state = this.states.get(taskId);
        if (!state) {
            throw new Error(`Failed to create state for task ${taskId}`);
        }
        return state;
    }

    /**
     * Update state for a task
     */
    updateState(taskId: string, update: Partial<Omit<EscalationState, 'taskId' | 'createdAt'>>): EscalationState {
        const state = this.getState(taskId);
        const updated = {
            ...state,
            ...update,
            updatedAt: new Date().toISOString(),
        };
        this.states.set(taskId, updated);
        return updated;
    }

    /**
     * Record an attempt at a level
     */
    recordAttempt(taskId: string, level: EscalationLevel): EscalationState {
        const state = this.getState(taskId);
        const levelKey = `level${level}`;
        const attempts = {
            ...state.attempts,
            [levelKey]: (state.attempts[levelKey] || 0) + 1,
        };
        return this.updateState(taskId, { attempts });
    }

    /**
     * Record an error
     */
    recordError(taskId: string, error: string): EscalationState {
        const state = this.getState(taskId);
        const errors = [...state.errors, error];
        return this.updateState(taskId, { errors });
    }

    /**
     * Escalate to next level
     */
    escalate(taskId: string): EscalationState {
        const state = this.getState(taskId);
        const newLevel = Math.min(6, state.level + 1) as EscalationLevel;
        return this.updateState(taskId, { level: newLevel });
    }

    /**
     * Mark task as resolved
     */
    resolve(taskId: string): EscalationState {
        return this.updateState(taskId, { resolved: true });
    }

    /**
     * Add cost to task
     */
    addCost(taskId: string, cost: number): EscalationState {
        const state = this.getState(taskId);
        return this.updateState(taskId, { cost: state.cost + cost });
    }

    /**
     * Set approval status
     */
    setApproval(taskId: string, approved: boolean): EscalationState {
        return this.updateState(taskId, { approved });
    }

    /**
     * Reset state for a task
     */
    resetState(taskId: string): void {
        this.states.delete(taskId);
    }

    /**
     * Get all states
     */
    getAllStates(): EscalationState[] {
        return Array.from(this.states.values());
    }

    /**
     * Get unresolved states
     */
    getUnresolved(): EscalationState[] {
        return this.getAllStates().filter((s) => !s.resolved);
    }

    /**
     * Clear all states
     */
    clear(): void {
        this.states.clear();
    }

    /**
     * Get total cost across all tasks
     */
    getTotalCost(): number {
        return this.getAllStates().reduce((sum, s) => sum + s.cost, 0);
    }
}
