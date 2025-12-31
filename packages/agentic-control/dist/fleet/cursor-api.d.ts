/**
 * CursorAPI - Direct HTTP client for Cursor Background Agent API
 *
 * Bypasses MCP for direct API access with better performance and reliability.
 * Adapted from cursor-fleet with enhanced error handling.
 */
import type { Agent, Conversation, Repository, Result } from '../core/types.js';
export interface CursorAPIOptions {
    /** API key (defaults to CURSOR_API_KEY env var) */
    apiKey?: string;
    /** Request timeout in milliseconds (default: 60000) */
    timeout?: number;
    /** API base URL (default: https://api.cursor.com/v0) */
    baseUrl?: string;
    /** Maximum number of retries for transient errors (default: 3) */
    maxRetries?: number;
    /** Initial delay for exponential backoff in ms (default: 1000) */
    retryDelay?: number;
}
export declare class CursorAPI {
    private readonly apiKey;
    private readonly timeout;
    private readonly baseUrl;
    private readonly maxRetries;
    private readonly retryDelay;
    constructor(options?: CursorAPIOptions);
    /**
     * Check if API key is available
     */
    static isAvailable(): boolean;
    private request;
    /**
     * List all agents
     */
    listAgents(): Promise<Result<Agent[]>>;
    /**
     * Get status of a specific agent
     */
    getAgentStatus(agentId: string): Promise<Result<Agent>>;
    /**
     * Get conversation history for an agent
     */
    getAgentConversation(agentId: string): Promise<Result<Conversation>>;
    /**
     * Launch a new agent
     *
     * API Spec: https://cursor.com/docs/cloud-agent/api/endpoints
     */
    launchAgent(options: {
        prompt: {
            text: string;
            images?: Array<{
                data: string;
                dimension?: {
                    width: number;
                    height: number;
                };
            }>;
        };
        source: {
            repository: string;
            ref?: string;
        };
        target?: {
            autoCreatePr?: boolean;
            branchName?: string;
            openAsCursorGithubApp?: boolean;
            skipReviewerRequest?: boolean;
        };
        webhook?: {
            url: string;
            secret?: string;
        };
    }): Promise<Result<Agent>>;
    /**
     * Send a follow-up message to an agent
     */
    addFollowup(agentId: string, prompt: {
        text: string;
    }): Promise<Result<void>>;
    /**
     * List available repositories
     */
    listRepositories(): Promise<Result<Repository[]>>;
    /**
     * List available models
     *
     * API Spec: https://cursor.com/docs/cloud-agent/api/endpoints#list-models
     */
    listModels(): Promise<Result<string[]>>;
}
//# sourceMappingURL=cursor-api.d.ts.map