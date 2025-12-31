import { beforeEach, describe, expect, it } from 'vitest';
import { EscalationStateManager } from '../src/escalation/state.js';

describe('EscalationStateManager', () => {
    let manager: EscalationStateManager;

    beforeEach(() => {
        manager = new EscalationStateManager();
    });

    describe('getState', () => {
        it('should create new state for task', () => {
            const state = manager.getState('task-1');
            expect(state.taskId).toBe('task-1');
            expect(state.level).toBe(0);
            expect(state.resolved).toBe(false);
            expect(state.cost).toBe(0);
            expect(state.approved).toBe(false);
            expect(state.attempts).toEqual({});
            expect(state.errors).toEqual([]);
        });

        it('should return same state on subsequent calls', () => {
            const state1 = manager.getState('task-1');
            const state2 = manager.getState('task-1');
            expect(state1).toBe(state2);
        });
    });

    describe('recordAttempt', () => {
        it('should record attempts per level', () => {
            manager.recordAttempt('task-1', 2);
            manager.recordAttempt('task-1', 2);
            const state = manager.getState('task-1');
            expect(state.attempts.level2).toBe(2);
        });

        it('should track attempts for multiple levels', () => {
            manager.recordAttempt('task-1', 0);
            manager.recordAttempt('task-1', 1);
            manager.recordAttempt('task-1', 2);
            const state = manager.getState('task-1');
            expect(state.attempts.level0).toBe(1);
            expect(state.attempts.level1).toBe(1);
            expect(state.attempts.level2).toBe(1);
        });
    });

    describe('escalate', () => {
        it('should increase level by one', () => {
            manager.escalate('task-1');
            let state = manager.getState('task-1');
            expect(state.level).toBe(1);

            manager.escalate('task-1');
            state = manager.getState('task-1');
            expect(state.level).toBe(2);
        });

        it('should cap escalation at level 6', () => {
            for (let i = 0; i < 10; i++) {
                manager.escalate('task-1');
            }
            const state = manager.getState('task-1');
            expect(state.level).toBe(6);
        });
    });

    describe('recordError', () => {
        it('should collect errors', () => {
            manager.recordError('task-1', 'Error 1');
            manager.recordError('task-1', 'Error 2');
            const state = manager.getState('task-1');
            expect(state.errors).toEqual(['Error 1', 'Error 2']);
        });
    });

    describe('resolve', () => {
        it('should mark as resolved', () => {
            const state = manager.resolve('task-1');
            expect(state.resolved).toBe(true);
        });
    });

    describe('addCost', () => {
        it('should accumulate cost', () => {
            manager.addCost('task-1', 100);
            manager.addCost('task-1', 200);
            const state = manager.getState('task-1');
            expect(state.cost).toBe(300);
        });
    });

    describe('setApproval', () => {
        it('should set approval flag', () => {
            const state = manager.setApproval('task-1', true);
            expect(state.approved).toBe(true);
        });
    });

    describe('resetState', () => {
        it('should reset state for task', () => {
            manager.recordAttempt('task-1', 0);
            manager.addCost('task-1', 100);
            manager.resetState('task-1');
            const state = manager.getState('task-1');
            expect(state.attempts).toEqual({});
            expect(state.cost).toBe(0);
        });
    });

    describe('getAllStates', () => {
        it('should return all states', () => {
            manager.getState('task-1');
            manager.getState('task-2');
            const states = manager.getAllStates();
            expect(states).toHaveLength(2);
        });
    });

    describe('getUnresolved', () => {
        it('should return only unresolved states', () => {
            manager.getState('task-1');
            manager.resolve('task-2');
            const unresolved = manager.getUnresolved();
            expect(unresolved).toHaveLength(1);
            expect(unresolved[0].taskId).toBe('task-1');
        });
    });

    describe('getTotalCost', () => {
        it('should sum cost across all tasks', () => {
            manager.addCost('task-1', 100);
            manager.addCost('task-2', 200);
            expect(manager.getTotalCost()).toBe(300);
        });
    });

    describe('clear', () => {
        it('should remove all states', () => {
            manager.getState('task-1');
            manager.getState('task-2');
            manager.clear();
            const states = manager.getAllStates();
            expect(states).toHaveLength(0);
        });
    });
});
