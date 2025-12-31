import { beforeEach, describe, expect, it } from 'vitest';
import { CostTracker } from '../src/escalation/cost-tracker.js';

describe('CostTracker', () => {
    let tracker: CostTracker;

    beforeEach(() => {
        tracker = new CostTracker(1000); // $10 daily budget
    });

    describe('record', () => {
        it('should record cost entries', () => {
            const entry = tracker.record('task-1', 'cloud-agent', 500, 'Test operation');
            expect(entry.taskId).toBe('task-1');
            expect(entry.agent).toBe('cloud-agent');
            expect(entry.amount).toBe(500);
            expect(entry.description).toBe('Test operation');
        });

        it('should use default description', () => {
            const entry = tracker.record('task-1', 'agent', 100);
            expect(entry.description).toBe('Cloud agent operation');
        });
    });

    describe('getDailyStats', () => {
        it('should calculate total and operations', () => {
            tracker.record('task-1', 'agent-a', 300);
            tracker.record('task-2', 'agent-b', 200);

            const stats = tracker.getDailyStats();
            expect(stats.total).toBe(500);
            expect(stats.operations).toBe(2);
        });

        it('should group by agent', () => {
            tracker.record('task-1', 'agent-a', 300);
            tracker.record('task-2', 'agent-b', 200);
            tracker.record('task-3', 'agent-a', 100);

            const stats = tracker.getDailyStats();
            expect(stats.byAgent['agent-a']).toBe(400);
            expect(stats.byAgent['agent-b']).toBe(200);
        });

        it('should return entries', () => {
            tracker.record('task-1', 'agent', 100);
            const stats = tracker.getDailyStats();
            expect(stats.entries).toHaveLength(1);
        });
    });

    describe('canAfford', () => {
        it('should return true when within budget', () => {
            tracker.record('task-1', 'agent', 600);
            expect(tracker.canAfford(300)).toBe(true);
        });

        it('should return false when exceeding budget', () => {
            tracker.record('task-1', 'agent', 600);
            expect(tracker.canAfford(500)).toBe(false);
        });

        it('should not allow operations when budget is 0', () => {
            const zeroBudgetTracker = new CostTracker(0);
            expect(zeroBudgetTracker.canAfford(1)).toBe(false);
        });
    });

    describe('getRemainingBudget', () => {
        it('should calculate remaining budget', () => {
            tracker.record('task-1', 'agent', 600);
            expect(tracker.getRemainingBudget()).toBe(400);
        });

        it('should not go negative', () => {
            tracker.record('task-1', 'agent', 1200);
            expect(tracker.getRemainingBudget()).toBe(0);
        });
    });

    describe('getTotalCost', () => {
        it('should sum across all entries', () => {
            tracker.record('task-1', 'agent', 100);
            tracker.record('task-2', 'agent', 200);
            expect(tracker.getTotalCost()).toBe(300);
        });
    });

    describe('export and import', () => {
        it('should preserve data', () => {
            tracker.record('task-1', 'agent', 100);
            const exported = tracker.export();

            const newTracker = new CostTracker(1000);
            newTracker.import(exported);

            expect(newTracker.getDailyStats().total).toBe(100);
        });
    });

    describe('reset', () => {
        it('should clear all tracking data', () => {
            tracker.record('task-1', 'agent', 100);
            tracker.reset();
            expect(tracker.getDailyStats().total).toBe(0);
        });
    });

    describe('budget management', () => {
        it('should get daily budget', () => {
            expect(tracker.getDailyBudget()).toBe(1000);
        });

        it('should update daily budget', () => {
            tracker.setDailyBudget(2000);
            expect(tracker.getDailyBudget()).toBe(2000);
        });
    });
});
