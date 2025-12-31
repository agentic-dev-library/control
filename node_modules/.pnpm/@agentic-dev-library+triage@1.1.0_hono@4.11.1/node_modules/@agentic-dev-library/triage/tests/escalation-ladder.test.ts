import { beforeEach, describe, expect, it } from 'vitest';
import { EscalationLadder, type LevelHandler, type Task } from '../src/escalation/index.js';

describe('EscalationLadder', () => {
    let ladder: EscalationLadder;
    let mockTask: Task;

    beforeEach(() => {
        ladder = new EscalationLadder({
            maxOllamaAttempts: 2,
            maxJulesAttempts: 2,
            maxJulesBoostAttempts: 2,
            cloudAgentEnabled: true,
            cloudAgentApprovalRequired: false,
            costBudgetDaily: 10000,
        });

        mockTask = {
            id: 'test-task',
            description: 'Fix the bug',
            context: 'const x = 1;',
        };
    });

    describe('basic functionality', () => {
        it('should process task successfully at first level', async () => {
            const handler: LevelHandler = async () => ({
                success: true,
                data: 'Fixed!',
                escalate: false,
            });

            ladder.registerHandler(0, handler);

            const result = await ladder.process(mockTask);
            expect(result.success).toBe(true);
            expect(result.level).toBe(0);
            expect(result.data).toBe('Fixed!');
            expect(result.attempts).toBe(1);
        });

        it('should handle missing handlers gracefully', async () => {
            // No handlers registered
            const result = await ladder.process(mockTask);
            expect(result.success).toBe(false);
            expect(result.error).toContain('exhausted');
        });
    });

    describe('escalation', () => {
        it('should escalate through multiple levels', async () => {
            ladder.registerHandler(0, async () => ({
                success: false,
                error: 'Level 0 failed',
                escalate: true,
            }));

            ladder.registerHandler(1, async () => ({
                success: false,
                error: 'Level 1 failed',
                escalate: true,
            }));

            ladder.registerHandler(2, async () => ({
                success: true,
                data: 'Level 2 success',
                escalate: false,
            }));

            const result = await ladder.process(mockTask);
            expect(result.success).toBe(true);
            expect(result.level).toBe(2);
            expect(result.attempts).toBe(3);
            expect(result.trail).toHaveLength(3);
        });

        it('should respect max attempts per level', async () => {
            let attemptCount = 0;

            ladder.registerHandler(2, async () => {
                attemptCount++;
                return {
                    success: false,
                    error: 'Failed',
                    escalate: false, // Don't escalate, retry
                };
            });

            ladder.registerHandler(3, async () => ({
                success: true,
                escalate: false,
            }));

            await ladder.process(mockTask);

            // Should have tried level 2 exactly 2 times (maxOllamaAttempts)
            expect(attemptCount).toBe(2);
        });
    });

    describe('cost tracking', () => {
        it('should track cost across levels', async () => {
            ladder.registerHandler(0, async () => ({
                success: false,
                cost: 0,
                escalate: true,
            }));

            ladder.registerHandler(6, async () => ({
                success: true,
                cost: 1000,
                escalate: false,
            }));

            const result = await ladder.process(mockTask);
            expect(result.cost).toBe(1000);
            expect(ladder.getState(mockTask.id).cost).toBe(1000);
        });
    });

    describe('cloud agent approval', () => {
        it('should skip level 6 when cloud agents disabled', async () => {
            ladder.updateConfig({ cloudAgentEnabled: false });

            ladder.registerHandler(5, async () => ({
                success: false,
                escalate: true,
            }));

            const result = await ladder.process(mockTask);
            expect(result.success).toBe(false);
            expect(result.trail.some((t) => t.level === 6)).toBe(false);
        });

        it('should require approval for cloud agents when configured', async () => {
            ladder.updateConfig({
                cloudAgentEnabled: true,
                cloudAgentApprovalRequired: true,
            });

            ladder.registerHandler(5, async () => ({
                success: false,
                escalate: true,
            }));

            const taskWithoutApproval = { ...mockTask, id: 'task-no-approval' };
            const result = await ladder.process(taskWithoutApproval);
            expect(result.success).toBe(false);
            expect(result.trail.some((t) => t.level === 6)).toBe(false);
        });

        it('should detect cloud agent approval from metadata labels', async () => {
            ladder.updateConfig({
                cloudAgentEnabled: true,
                cloudAgentApprovalRequired: true,
            });

            const taskWithApproval = {
                ...mockTask,
                id: 'task-with-approval',
                metadata: { labels: ['approved:cloud-agent'] },
            };

            ladder.registerHandler(6, async () => ({
                success: true,
                escalate: false,
            }));

            const result = await ladder.process(taskWithApproval);
            expect(result.trail.some((t) => t.level === 6 && t.success)).toBe(true);
        });
    });

    describe('error handling', () => {
        it('should handle handler exceptions', async () => {
            ladder.registerHandler(0, async () => {
                throw new Error('Handler crashed');
            });

            ladder.registerHandler(1, async () => ({
                success: true,
                escalate: false,
            }));

            const result = await ladder.process(mockTask);
            expect(result.success).toBe(true);
            expect(result.level).toBe(1);
            expect(result.trail[0].error).toContain('crashed');
        });
    });

    describe('state management', () => {
        it('should get and reset state', () => {
            const state = ladder.getState('task-1');
            expect(state.taskId).toBe('task-1');

            ladder.resetState('task-1');
            const newState = ladder.getState('task-1');
            expect(newState.attempts).toEqual({});
        });

        it('should get all states', async () => {
            ladder.registerHandler(0, async () => ({
                success: true,
                escalate: false,
            }));

            await ladder.process({ ...mockTask, id: 'task-1' });
            await ladder.process({ ...mockTask, id: 'task-2' });

            const states = ladder.getAllStates();
            expect(states).toHaveLength(2);
        });
    });

    describe('configuration', () => {
        it('should get cost tracker', () => {
            const tracker = ladder.getCostTracker();
            expect(tracker.getDailyBudget()).toBe(10000);
        });

        it('should get and update config', () => {
            const config = ladder.getConfig();
            expect(config.cloudAgentEnabled).toBe(true);

            ladder.updateConfig({ cloudAgentEnabled: false });
            expect(ladder.getConfig().cloudAgentEnabled).toBe(false);
        });
    });
});
