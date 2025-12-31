/**
 * Intelligent Task Router
 *
 * Routes tasks to optimal agents based on:
 * 1. Sigma-weighted complexity scores
 * 2. Agent capabilities and availability
 * 3. Cost optimization (prefer cheaper agents)
 * 4. Escalation on failure
 */

import type { AgentDefinition, AgentRegistry, AgentResult, AgentTask } from './agents.js';
import type { ComplexityScore } from './evaluator.js';
import type { ComplexityTier } from './weights.js';

export interface RouterConfig {
    /** Agent registry with available agents */
    registry: AgentRegistry;
    /** Maximum retries per agent before escalating */
    maxRetries?: number;
    /** Daily cost budget (0 = unlimited) */
    dailyBudget?: number;
    /** Callback when an agent is selected */
    onAgentSelected?: (agent: AgentDefinition, task: AgentTask) => void;
    /** Callback when escalating */
    onEscalate?: (fromAgent: AgentDefinition, toAgent: AgentDefinition, reason: string) => void;
    /** Callback for cost tracking */
    onCostIncurred?: (agent: AgentDefinition, cost: number, task: AgentTask) => void;
}

export interface RoutingResult<T = unknown> {
    /** Whether the task was successfully completed */
    success: boolean;
    /** Which agent handled the task */
    agent: string;
    /** The result from the agent */
    result: AgentResult<T>;
    /** Total cost incurred */
    totalCost: number;
    /** Number of attempts made */
    attempts: number;
    /** Trail of agents tried */
    trail: Array<{ agent: string; success: boolean; error?: string }>;
}

export interface RouterState {
    /** Costs incurred today */
    dailyCosts: number;
    /** Last reset timestamp */
    lastReset: string;
    /** Tasks processed today */
    tasksProcessed: number;
}

/**
 * Task Router - intelligently routes tasks to agents
 */
export class TaskRouter {
    private config: Required<Omit<RouterConfig, 'onAgentSelected' | 'onEscalate' | 'onCostIncurred'>> &
        Pick<RouterConfig, 'onAgentSelected' | 'onEscalate' | 'onCostIncurred'>;
    private state: RouterState;

    constructor(config: RouterConfig) {
        this.config = {
            maxRetries: 2,
            dailyBudget: 0,
            ...config,
        };
        this.state = {
            dailyCosts: 0,
            lastReset: new Date().toISOString().split('T')[0],
            tasksProcessed: 0,
        };
    }

    /**
     * Route a task to the optimal agent
     */
    async route(
        task: Omit<AgentTask, 'complexityScore' | 'complexityTier'>,
        complexity: ComplexityScore
    ): Promise<RoutingResult> {
        this.maybeResetDaily();

        const fullTask: AgentTask = {
            ...task,
            complexityScore: complexity.weighted,
            complexityTier: complexity.tier,
        };

        const trail: RoutingResult['trail'] = [];
        let totalCost = 0;

        // Try each tier from current to expert
        const tierOrder: ComplexityTier[] = ['trivial', 'simple', 'moderate', 'complex', 'expert'];
        const startIndex = tierOrder.indexOf(complexity.tier);

        for (let i = startIndex; i < tierOrder.length; i++) {
            const tier = tierOrder[i];
            const agents = this.config.registry.forTier(tier);

            for (const agent of agents) {
                if (!this.canUseAgent(agent, fullTask)) {
                    continue;
                }

                const result = await this.tryAgent(agent, fullTask, trail);
                totalCost += result.totalCost;

                if (result.success && result.agentResult) {
                    this.state.tasksProcessed++;
                    return {
                        success: true,
                        agent: agent.id,
                        result: result.agentResult,
                        totalCost,
                        attempts: trail.length,
                        trail,
                    };
                }

                // If agent failed but next agent in same tier exists, escalate
                const nextAgent = agents[agents.indexOf(agent) + 1];
                if (nextAgent) {
                    this.config.onEscalate?.(agent, nextAgent, 'Agent failed');
                }
            }
        }

        // All agents exhausted
        this.state.tasksProcessed++;
        return {
            success: false,
            agent: 'none',
            result: { success: false, error: 'All agents exhausted', cost: 0 },
            totalCost,
            attempts: trail.length,
            trail,
        };
    }

    /**
     * Check if an agent can be used for a task
     */
    private canUseAgent(agent: AgentDefinition, task: AgentTask): boolean {
        // Check approval requirement
        if (agent.requiresApproval && !this.hasApproval(task, agent)) {
            return false;
        }

        // Check budget
        if (this.config.dailyBudget > 0 && this.state.dailyCosts + agent.cost > this.config.dailyBudget) {
            return false;
        }

        return true;
    }

    /**
     * Try an agent with retries
     */
    private async tryAgent(
        agent: AgentDefinition,
        task: AgentTask,
        trail: RoutingResult['trail']
    ): Promise<{ success: boolean; totalCost: number; agentResult?: AgentResult }> {
        let totalCost = 0;

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            this.config.onAgentSelected?.(agent, task);

            try {
                const result = await agent.execute(task);
                totalCost += result.cost;
                this.state.dailyCosts += result.cost;
                this.config.onCostIncurred?.(agent, result.cost, task);

                trail.push({
                    agent: agent.id,
                    success: result.success,
                    error: result.error,
                });

                if (result.success) {
                    return { success: true, totalCost, agentResult: result };
                }

                // If agent says don't retry, break to next agent
                if (result.escalate || attempt >= this.config.maxRetries) {
                    return { success: false, totalCost, agentResult: result };
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                trail.push({ agent: agent.id, success: false, error: errorMessage });
                if (attempt >= this.config.maxRetries) {
                    return { success: false, totalCost };
                }
            }
        }

        return { success: false, totalCost };
    }

    /**
     * Check if a task has approval for an agent that requires it
     */
    private hasApproval(task: AgentTask, agent: AgentDefinition): boolean {
        // Check metadata for approval flag
        const approved = task.metadata?.approved as string[] | undefined;
        return approved?.includes(agent.id) ?? false;
    }

    /**
     * Reset daily state if it's a new day
     */
    private maybeResetDaily(): void {
        const today = new Date().toISOString().split('T')[0];
        if (this.state.lastReset !== today) {
            this.state = {
                dailyCosts: 0,
                lastReset: today,
                tasksProcessed: 0,
            };
        }
    }

    /**
     * Get current router state
     */
    getState(): RouterState {
        return { ...this.state };
    }

    /**
     * Get remaining daily budget
     */
    getRemainingBudget(): number {
        if (this.config.dailyBudget === 0) return Number.POSITIVE_INFINITY;
        return Math.max(0, this.config.dailyBudget - this.state.dailyCosts);
    }
}

/**
 * Create a simple router with default configuration
 */
export function createRouter(registry: AgentRegistry, options?: Partial<RouterConfig>): TaskRouter {
    return new TaskRouter({ registry, ...options });
}
