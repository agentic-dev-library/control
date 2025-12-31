/**
 * Google Jules Provider Implementation
 *
 * Creates agents that use Google Jules for complex async tasks.
 * Jules can create PRs, run commands, and handle multi-file changes.
 */
import type { AgentCapabilities, AgentDefinition } from '@agentic/triage';
export interface JulesConfig {
    /** Jules API key */
    apiKey: string;
    /** API base URL (default: https://jules.googleapis.com/v1alpha) */
    baseUrl?: string;
    /** Automation mode (default: AUTO_CREATE_PR) */
    automationMode?: 'AUTOMATION_MODE_UNSPECIFIED' | 'AUTO_CREATE_PR' | 'MANUAL';
}
export interface JulesSessionResult {
    /** Session ID for polling */
    sessionId: string;
    /** Session name/resource path */
    name: string;
    /** Current state */
    state: string;
}
/**
 * Create a Jules-based agent for the registry
 */
export declare function createJulesAgent(id: string, config: JulesConfig, options?: {
    name?: string;
    cost?: number;
    priority?: number;
    capabilities?: Partial<AgentCapabilities>;
}): AgentDefinition<JulesSessionResult>;
/**
 * Poll a Jules session for completion
 */
export declare function pollJulesSession(config: JulesConfig, sessionName: string): Promise<{
    state: string;
    prUrl?: string;
    error?: string;
}>;
/**
 * Send a follow-up message to a Jules session
 */
export declare function sendJulesFollowUp(config: JulesConfig, sessionName: string, message: string): Promise<void>;
//# sourceMappingURL=jules.d.ts.map