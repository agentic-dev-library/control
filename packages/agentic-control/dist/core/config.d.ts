/**
 * Configuration Management for agentic-control
 *
 * Uses cosmiconfig for standard config file discovery and loading.
 * Searches for configuration in:
 *   - agentic.config.json
 *   - agentic.config.js
 *   - agentic.config.cjs
 *   - .agenticrc
 *   - .agenticrc.json
 *   - package.json "agentic" key
 *
 * Priority: CLI args > env vars > config file > defaults
 *
 * @example Config file (agentic.config.json):
 * ```json
 * {
 *   "tokens": {
 *     "organizations": {
 *       "my-org": { "name": "my-org", "tokenEnvVar": "MY_ORG_TOKEN" }
 *     }
 *   },
 *   "defaultModel": "claude-sonnet-4-20250514",
 *   "fleet": {
 *     "autoCreatePr": true
 *   }
 * }
 * ```
 */
import type { TokenConfig } from './types.js';
export interface FleetConfig {
    /** Auto-create PR when agent completes */
    autoCreatePr?: boolean;
    /** Open PR as Cursor GitHub App */
    openAsCursorGithubApp?: boolean;
    /** Skip adding user as reviewer */
    skipReviewerRequest?: boolean;
}
export interface TriageConfig {
    /** AI provider: anthropic, openai, google, mistral, azure */
    provider?: string;
    /** Model ID for the provider */
    model?: string;
    /** API key environment variable name */
    apiKeyEnvVar?: string;
}
export interface MCPServerConfig {
    /** Whether this MCP server is enabled */
    enabled?: boolean;
    /** Environment variable name for the API key/token */
    tokenEnvVar?: string;
    /** Fallback env vars to try if primary not found */
    tokenEnvVarFallbacks?: string[];
    /** Transport mode: stdio or proxy */
    mode?: 'stdio' | 'proxy';
    /** Command to run for stdio transport */
    command?: string;
    /** Arguments for the command */
    args?: string[];
    /** Proxy URL for proxy mode */
    proxyUrl?: string;
}
export interface MCPConfig {
    /** Cursor Background Agent MCP */
    cursor?: MCPServerConfig;
    /** GitHub MCP */
    github?: MCPServerConfig;
    /** Context7 documentation MCP */
    context7?: MCPServerConfig;
    /** 21st.dev Magic MCP */
    '21st-magic'?: MCPServerConfig;
    /** Custom MCP servers */
    [key: string]: MCPServerConfig | undefined;
}
export interface AgenticConfig {
    /** Token configuration for multi-org access */
    tokens?: Partial<TokenConfig>;
    /** Default repository for fleet operations */
    defaultRepository?: string;
    /** Coordination PR number for fleet communication */
    coordinationPr?: number;
    /** Log level */
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    /** Whether to enable verbose output */
    verbose?: boolean;
    /** Cursor API configuration */
    cursor?: {
        /** API key environment variable name */
        apiKeyEnvVar?: string;
        /** Base URL for Cursor API */
        baseUrl?: string;
    };
    /** Fleet default options */
    fleet?: FleetConfig;
    /** Triage (AI analysis) configuration */
    triage?: TriageConfig;
    /** MCP server configuration */
    mcp?: MCPConfig;
}
/**
 * Initialize configuration from all sources
 * Priority: programmatic overrides > env vars > config file
 */
export declare function initConfig(overrides?: Partial<AgenticConfig>): AgenticConfig;
/**
 * Load config from a specific file path
 */
export declare function loadConfigFromPath(filepath: string): AgenticConfig;
/**
 * Get the current configuration
 */
export declare function getConfig(): AgenticConfig;
/**
 * Get path to loaded config file
 */
export declare function getConfigPath(): string | null;
/**
 * Update configuration at runtime
 */
export declare function setConfig(updates: Partial<AgenticConfig>): void;
/**
 * Reset configuration (useful for testing)
 */
export declare function resetConfig(): void;
/**
 * Get a specific configuration value
 */
export declare function getConfigValue<K extends keyof AgenticConfig>(key: K): AgenticConfig[K];
/**
 * Check if verbose mode is enabled
 */
export declare function isVerbose(): boolean;
/**
 * Get triage configuration
 */
export declare function getTriageConfig(): TriageConfig;
/**
 * Get the default model for triage operations
 * @deprecated Use getTriageConfig() instead
 */
export declare function getDefaultModel(): string;
/**
 * Get fleet defaults
 */
export declare function getFleetDefaults(): FleetConfig;
/**
 * Get the log level
 */
export declare function getLogLevel(): string;
/**
 * Get Cursor API key from configured environment variable
 */
export declare function getCursorApiKey(): string | undefined;
/**
 * Get default API key env var for a provider
 */
export declare function getDefaultApiKeyEnvVar(provider?: string): string;
/**
 * Get triage API key from configured environment variable
 * @param providerOverride - Optional provider to use instead of config value
 */
export declare function getTriageApiKey(providerOverride?: string): string | undefined;
export declare const log: {
    debug: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
};
//# sourceMappingURL=config.d.ts.map