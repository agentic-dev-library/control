/**
 * Fleet - High-level API for Cursor Background Agent management
 *
 * Provides a clean interface for:
 * - Listing and monitoring agents
 * - Spawning new agents with context and model specification
 * - Sending follow-up messages
 * - Archiving conversations
 * - Diamond pattern orchestration
 * - Token-aware GitHub coordination
 *
 * All configuration is user-provided - no hardcoded values.
 */
import type { Agent, AgentStatus, Conversation, DiamondConfig, Repository, Result, SpawnOptions } from '../core/types.js';
import { type CursorAPIOptions } from './cursor-api.js';
export interface FleetConfig extends CursorAPIOptions {
    /** Path to archive conversations (default: ./memory-bank/recovery) */
    archivePath?: string;
}
export interface CoordinationConfig {
    /** PR number for coordination channel */
    coordinationPr: number;
    /** Repository in owner/repo format */
    repo: string;
    /** Outbound poll interval (ms) - check agents */
    outboundInterval?: number;
    /** Inbound poll interval (ms) - check PR comments */
    inboundInterval?: number;
    /** Agent IDs to monitor */
    agentIds?: string[];
}
export interface SpawnContext {
    controlManagerId?: string;
    controlCenter?: string;
    relatedAgents?: string[];
    metadata?: Record<string, unknown>;
}
/**
 * Fleet management for Cursor Background Agents
 *
 * Provides high-level operations for managing AI agents across multiple
 * GitHub organizations with automatic token switching and coordination.
 *
 * @example
 * ```typescript
 * const fleet = new Fleet();
 *
 * // Spawn a new agent
 * const result = await fleet.spawn({
 *   repository: 'https://github.com/owner/repo',
 *   task: 'Fix the authentication bug',
 *   target: { autoCreatePr: true }
 * });
 *
 * // Monitor agent status
 * const status = await fleet.status(result.data.id);
 * ```
 */
export declare class Fleet {
    private api;
    private archivePath;
    private useDirectApi;
    /**
     * Create a new Fleet instance
     *
     * @param config - Fleet configuration options including API key and timeout
     */
    constructor(config?: FleetConfig);
    /**
     * Check if direct API is available
     */
    isApiAvailable(): boolean;
    /**
     * List all agents
     */
    list(): Promise<Result<Agent[]>>;
    /**
     * List agents filtered by status
     */
    listByStatus(status: AgentStatus): Promise<Result<Agent[]>>;
    /**
     * Get running agents only
     */
    running(): Promise<Result<Agent[]>>;
    /**
     * Find agent by ID
     */
    find(agentId: string): Promise<Result<Agent | undefined>>;
    /**
     * Get agent status
     */
    status(agentId: string): Promise<Result<Agent>>;
    /**
     * Spawn a new agent
     *
     * API Spec: https://cursor.com/docs/cloud-agent/api/endpoints
     *
     * @param options - Spawn options including repository, task, ref, target, and webhook
     */
    spawn(options: SpawnOptions & {
        context?: SpawnContext;
    }): Promise<Result<Agent>>;
    /**
     * Build task string with coordination context
     */
    private buildTaskWithContext;
    /**
     * Send a follow-up message to an agent
     */
    followup(agentId: string, message: string): Promise<Result<void>>;
    /**
     * Broadcast message to multiple agents
     */
    broadcast(agentIds: string[], message: string): Promise<Map<string, Result<void>>>;
    /**
     * Get agent conversation
     */
    conversation(agentId: string): Promise<Result<Conversation>>;
    /**
     * Archive agent conversation to disk
     */
    archive(agentId: string, outputPath?: string): Promise<Result<string>>;
    /**
     * List available repositories
     */
    repositories(): Promise<Result<Repository[]>>;
    /**
     * List available Cursor models
     */
    listModels(): Promise<Result<string[]>>;
    /**
     * Create a diamond pattern orchestration
     */
    createDiamond(config: DiamondConfig): Promise<Result<{
        targetAgents: Agent[];
        counterpartyAgent: Agent;
    }>>;
    /**
     * Get fleet summary
     */
    summary(): Promise<Result<{
        total: number;
        running: number;
        completed: number;
        failed: number;
        agents: Agent[];
    }>>;
    /**
     * Wait for agent to complete
     */
    waitFor(agentId: string, options?: {
        timeout?: number;
        pollInterval?: number;
    }): Promise<Result<Agent>>;
    /**
     * Monitor specific agents until all complete
     */
    monitorAgents(agentIds: string[], options?: {
        pollInterval?: number;
        onProgress?: (status: Map<string, AgentStatus>) => void;
    }): Promise<Map<string, Agent>>;
    /**
     * Run bidirectional coordination loop with intelligent token switching
     */
    coordinate(config: CoordinationConfig): Promise<void>;
    private outboundLoop;
    private inboundLoop;
    private processCoordinationComment;
}
//# sourceMappingURL=fleet.d.ts.map