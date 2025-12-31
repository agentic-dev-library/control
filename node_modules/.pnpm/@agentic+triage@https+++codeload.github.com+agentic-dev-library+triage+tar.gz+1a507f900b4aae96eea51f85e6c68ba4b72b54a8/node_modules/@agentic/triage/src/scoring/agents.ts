/**
 * Provider-Agnostic Agent Interfaces
 *
 * This module defines ONLY the interfaces and registry.
 * Actual provider implementations (Ollama, Jules, Cursor, etc.)
 * belong in @agentic/control where users configure their stack.
 *
 * The key insight: developers can use ANY LLM/agent provider
 * by implementing the AgentExecutor interface and registering
 * it with their desired priority and cost weights.
 */

import type { ComplexityTier } from './weights.js';

// ============================================================================
// Core Interfaces - Provider Agnostic
// ============================================================================

/**
 * What an agent is capable of doing
 */
export interface AgentCapabilities {
    /** Complexity tiers this agent can handle */
    tiers: ComplexityTier[];
    /** Maximum context length (tokens/chars) */
    maxContext?: number;
    /** Can this agent create PRs? */
    canCreatePR?: boolean;
    /** Can this agent run commands? */
    canExecute?: boolean;
    /** Is this agent async (returns job ID to poll)? */
    async?: boolean;
    /** Custom capability flags */
    [key: string]: unknown;
}

/**
 * A task to be processed by an agent
 */
export interface AgentTask {
    /** Unique task identifier */
    id: string;
    /** Task description/prompt */
    description: string;
    /** Code/diff context */
    context: string;
    /** Pre-computed complexity score (0-10) */
    complexityScore: number;
    /** Pre-computed complexity tier */
    complexityTier: ComplexityTier;
    /** Repository reference (optional) */
    repo?: string;
    /** Additional metadata for provider-specific needs */
    metadata?: Record<string, unknown>;
}

/**
 * Result from an agent execution
 */
export interface AgentResult<T = unknown> {
    /** Whether the task was completed successfully */
    success: boolean;
    /** Result data (provider-specific) */
    data?: T;
    /** Error message if failed */
    error?: string;
    /** Should router escalate to next agent? */
    escalate?: boolean;
    /** Actual cost incurred (in your cost units) */
    cost: number;
    /** For async agents: job ID to poll for completion */
    jobId?: string;
}

/**
 * Function signature for agent execution
 * Implement this interface to add any LLM/agent provider
 */
export type AgentExecutor<T = unknown> = (task: AgentTask) => Promise<AgentResult<T>>;

/**
 * Complete agent definition
 */
export interface AgentDefinition<T = unknown> {
    /** Unique identifier (e.g., 'ollama-qwen', 'jules', 'openai-gpt4') */
    id: string;
    /** Human-readable name */
    name: string;
    /**
     * Cost per invocation in your chosen units
     * Could be cents, tokens, or relative units (0=free, 100=expensive)
     */
    cost: number;
    /**
     * Priority when multiple agents can handle same tier
     * Lower = preferred (will be tried first)
     */
    priority: number;
    /** What this agent can do */
    capabilities: AgentCapabilities;
    /** Whether this agent is currently enabled */
    enabled: boolean;
    /**
     * Require explicit approval before using?
     * Useful for expensive agents - task.metadata.approved must include this agent's ID
     */
    requiresApproval?: boolean;
    /** The executor function - implement this for your provider */
    execute: AgentExecutor<T>;
}

// ============================================================================
// Agent Registry - The Core Primitive
// ============================================================================

/**
 * Registry for managing available agents
 *
 * @example
 * ```typescript
 * const registry = new AgentRegistry();
 *
 * // Register your agents (implementations from @agentic/control or custom)
 * registry.register(myOllamaAgent);
 * registry.register(myJulesAgent);
 * registry.register(myCustomAgent);
 *
 * // Get best agent for a complexity tier
 * const agent = registry.optimalFor('moderate');
 * ```
 */
export class AgentRegistry {
    private agents: Map<string, AgentDefinition> = new Map();

    /**
     * Register an agent
     */
    register<T>(agent: AgentDefinition<T>): this {
        this.agents.set(agent.id, agent as AgentDefinition);
        return this;
    }

    /**
     * Register multiple agents at once
     */
    registerAll(agents: AgentDefinition[]): this {
        for (const agent of agents) {
            this.register(agent);
        }
        return this;
    }

    /**
     * Unregister an agent
     */
    unregister(id: string): boolean {
        return this.agents.delete(id);
    }

    /**
     * Enable/disable an agent at runtime
     */
    setEnabled(id: string, enabled: boolean): void {
        const agent = this.agents.get(id);
        if (agent) {
            agent.enabled = enabled;
        }
    }

    /**
     * Update an agent's priority (for dynamic rebalancing)
     */
    setPriority(id: string, priority: number): void {
        const agent = this.agents.get(id);
        if (agent) {
            agent.priority = priority;
        }
    }

    /**
     * Update an agent's cost (for dynamic pricing)
     */
    setCost(id: string, cost: number): void {
        const agent = this.agents.get(id);
        if (agent) {
            agent.cost = cost;
        }
    }

    /**
     * Get all registered agents
     */
    all(): AgentDefinition[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get all enabled agents
     */
    enabled(): AgentDefinition[] {
        return this.all().filter((a) => a.enabled);
    }

    /**
     * Get agents that can handle a specific complexity tier
     * Sorted by priority (lowest first), then by cost
     */
    forTier(tier: ComplexityTier, includeDisabled = false): AgentDefinition[] {
        return this.all()
            .filter((a) => (includeDisabled || a.enabled) && a.capabilities.tiers.includes(tier))
            .sort((a, b) => {
                // First by priority (lower = better)
                if (a.priority !== b.priority) return a.priority - b.priority;
                // Then by cost (lower = better)
                return a.cost - b.cost;
            });
    }

    /**
     * Get the optimal (first choice) agent for a complexity tier
     */
    optimalFor(tier: ComplexityTier): AgentDefinition | undefined {
        return this.forTier(tier)[0];
    }

    /**
     * Get agent by ID
     */
    get(id: string): AgentDefinition | undefined {
        return this.agents.get(id);
    }

    /**
     * Check if an agent is registered
     */
    has(id: string): boolean {
        return this.agents.has(id);
    }

    /**
     * Get count of registered agents
     */
    get size(): number {
        return this.agents.size;
    }

    /**
     * Clear all agents
     */
    clear(): void {
        this.agents.clear();
    }

    /**
     * Export registry configuration (for serialization)
     */
    export(): Array<Omit<AgentDefinition, 'execute'>> {
        return this.all().map(({ execute, ...rest }) => rest);
    }
}

// ============================================================================
// Factory Helper Types
// ============================================================================

/**
 * Configuration for creating an agent (without the executor)
 * Used by @agentic/control to create provider-specific agents
 */
export type AgentConfig = Omit<AgentDefinition, 'execute'>;

/**
 * Factory function type for creating agents
 * Providers implement this to create configured agents
 */
export type AgentFactory<TConfig, TResult = unknown> = (
    id: string,
    config: TConfig,
    options?: Partial<AgentConfig>
) => AgentDefinition<TResult>;
