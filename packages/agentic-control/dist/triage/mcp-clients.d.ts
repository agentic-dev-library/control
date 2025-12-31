/**
 * MCP Client Integration - Config-driven
 *
 * Reads MCP server configuration from agentic.config.json.
 * Falls back to sensible defaults if not configured.
 */
import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import type { ToolSet } from 'ai';
import { type MCPServerConfig } from '../core/config.js';
/** @deprecated Use getMCPConfig() instead */
export declare const MCP_ENV_VARS: {
    readonly cursor: {
        readonly name: "CURSOR_API_KEY";
        readonly sources: readonly ["COPILOT_MCP_CURSOR_API_KEY", "CURSOR_API_KEY"];
    };
    readonly github: {
        readonly name: "GITHUB_TOKEN";
        readonly sources: readonly ["COPILOT_MCP_GITHUB_TOKEN", "GITHUB_JBCOM_TOKEN", "GITHUB_TOKEN"];
    };
    readonly context7: {
        readonly name: "CONTEXT7_API_KEY";
        readonly sources: readonly ["COPILOT_MCP_CONTEXT7_API_KEY", "CONTEXT7_API_KEY"];
        readonly optional: true;
    };
};
/** @deprecated Use getMCPConfig() and resolveToken() instead */
export declare const mcpCredentials: {
    readonly cursorApiKey: string | undefined;
    readonly githubToken: string | undefined;
    readonly context7ApiKey: string | undefined;
};
export interface MCPClientConfig {
    /** Override specific server configs */
    cursor?: Partial<MCPServerConfig> & {
        apiKey?: string;
    };
    github?: Partial<MCPServerConfig> & {
        token?: string;
    };
    context7?: Partial<MCPServerConfig> & {
        apiKey?: string;
    };
    '21st-magic'?: Partial<MCPServerConfig> & {
        apiKey?: string;
    };
    /**
     * Vendor Connectors MCP Server (Python)
     * Provides unified access to Jules, Cursor, GitHub, Slack, Vault, Zoom, etc.
     * Install: pip install vendor-connectors[mcp]
     */
    'vendor-connectors'?: Partial<MCPServerConfig> & {
        julesApiKey?: string;
        cursorApiKey?: string;
        ollamaApiKey?: string;
    };
}
export interface MCPClients {
    [name: string]: Awaited<ReturnType<typeof createMCPClient>> | undefined;
}
/**
 * Initialize MCP clients based on config
 */
export declare function initializeMCPClients(overrides?: MCPClientConfig): Promise<MCPClients>;
/**
 * Get all tools from initialized MCP clients
 */
export declare function getMCPTools(clients: MCPClients): Promise<ToolSet>;
/**
 * Close all MCP clients
 */
export declare function closeMCPClients(clients: MCPClients): Promise<void>;
//# sourceMappingURL=mcp-clients.d.ts.map