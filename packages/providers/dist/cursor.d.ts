/**
 * Cursor Cloud Agent Provider Implementation
 *
 * Creates agents that use Cursor Cloud Agents for expert-level tasks.
 * WARNING: Cursor Cloud Agents are expensive - use sparingly!
 */
import type { AgentCapabilities, AgentDefinition } from '@agentic/triage';
export interface CursorConfig {
    /** Cursor API key */
    apiKey: string;
    /** API base URL (default: https://api.cursor.com/v0) */
    baseUrl?: string;
    /** Workspace path in the cloud environment */
    workspacePath?: string;
}
export interface CursorAgentResult {
    /** Agent ID */
    agentId: string;
    /** Current status */
    status: string;
    /** Output messages */
    messages?: Array<{
        role: string;
        content: string;
    }>;
}
/**
 * Create a Cursor Cloud Agent for the registry
 *
 * ⚠️ EXPENSIVE - Requires explicit approval by default
 */
export declare function createCursorAgent(id: string, config: CursorConfig, options?: {
    name?: string;
    cost?: number;
    priority?: number;
    requiresApproval?: boolean;
    capabilities?: Partial<AgentCapabilities>;
}): AgentDefinition<CursorAgentResult>;
/**
 * Poll a Cursor agent for status
 */
export declare function pollCursorAgent(config: CursorConfig, agentId: string): Promise<CursorAgentResult>;
//# sourceMappingURL=cursor.d.ts.map