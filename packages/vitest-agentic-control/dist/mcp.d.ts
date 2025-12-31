/**
 * MCP (Model Context Protocol) mocking utilities for agentic-control testing.
 *
 * This module provides utilities for mocking MCP servers, tools, and resources
 * during testing. It allows you to simulate MCP server behavior without
 * needing actual MCP server implementations.
 *
 * @module mcp
 */
import { type Mock } from 'vitest';
/**
 * List of MCP-related modules that can be mocked.
 */
export declare const MCP_MODULES: readonly ["@modelcontextprotocol/sdk", "@modelcontextprotocol/sdk/client", "@modelcontextprotocol/sdk/server", "@ai-sdk/mcp"];
/**
 * Definition for a mock MCP tool.
 */
export interface MockToolDefinition {
    /** Tool name */
    name: string;
    /** Tool description */
    description?: string;
    /** Input schema (JSON Schema) */
    inputSchema?: Record<string, unknown>;
    /** Handler function for the tool */
    handler: (args: unknown) => unknown | Promise<unknown>;
}
/**
 * Definition for a mock MCP resource.
 */
export interface MockResourceDefinition {
    /** Resource URI */
    uri: string;
    /** Resource name */
    name?: string;
    /** Resource description */
    description?: string;
    /** MIME type */
    mimeType?: string;
    /** Resource content */
    content: string | Buffer;
}
/**
 * Options for creating an McpMocker instance.
 */
export interface McpMockerOptions {
    /** Whether to auto-mock all MCP modules */
    autoMock?: boolean;
}
/**
 * Mock MCP tool with call tracking.
 */
export interface MockMcpTool {
    /** Tool definition */
    definition: MockToolDefinition;
    /** Mock handler with call tracking */
    handler: Mock<(args: unknown) => unknown | Promise<unknown>>;
    /** Call history */
    calls: unknown[];
}
/**
 * Mock MCP resource.
 */
export interface MockMcpResource {
    /** Resource definition */
    definition: MockResourceDefinition;
    /** Read count */
    readCount: number;
}
/**
 * Mock MCP server configuration.
 */
export interface MockMcpServerConfig {
    /** Server name */
    name: string;
    /** Server tools */
    tools?: MockToolDefinition[];
    /** Server resources */
    resources?: MockResourceDefinition[];
    /** Server capabilities */
    capabilities?: {
        tools?: boolean;
        resources?: boolean;
        prompts?: boolean;
    };
}
/**
 * Mock MCP server instance.
 */
export declare class MockMcpServer {
    readonly name: string;
    readonly tools: Map<string, MockMcpTool>;
    readonly resources: Map<string, MockMcpResource>;
    readonly capabilities: {
        tools: boolean;
        resources: boolean;
        prompts: boolean;
    };
    private connected;
    constructor(config: MockMcpServerConfig);
    /**
     * Register a tool with this mock server.
     */
    registerTool(definition: MockToolDefinition): MockMcpTool;
    /**
     * Register a resource with this mock server.
     */
    registerResource(definition: MockResourceDefinition): MockMcpResource;
    /**
     * Connect to this mock server.
     */
    connect(): Promise<void>;
    /**
     * Disconnect from this mock server.
     */
    disconnect(): Promise<void>;
    /**
     * Check if connected.
     */
    isConnected(): boolean;
    /**
     * List available tools.
     */
    listTools(): Promise<Array<{
        name: string;
        description?: string;
        inputSchema?: Record<string, unknown>;
    }>>;
    /**
     * Call a tool.
     */
    callTool(name: string, args: unknown): Promise<unknown>;
    /**
     * List available resources.
     */
    listResources(): Promise<Array<{
        uri: string;
        name?: string;
        description?: string;
        mimeType?: string;
    }>>;
    /**
     * Read a resource.
     */
    readResource(uri: string): Promise<{
        uri: string;
        mimeType?: string;
        content: string | Buffer;
    }>;
    /**
     * Reset all call history.
     */
    reset(): void;
}
/**
 * MCP mocking utilities class.
 *
 * Provides methods for mocking MCP servers, tools, and resources
 * during testing.
 *
 * @example
 * ```typescript
 * import { McpMocker } from 'vitest-agentic-control';
 *
 * const mocker = new McpMocker();
 *
 * // Create a mock MCP server
 * const server = mocker.mockServer('test-server', {
 *   tools: [
 *     {
 *       name: 'get_weather',
 *       description: 'Get weather for a location',
 *       handler: (args) => ({ temp: 72, condition: 'sunny' }),
 *     },
 *   ],
 *   resources: [
 *     {
 *       uri: 'file:///config.json',
 *       content: '{"key": "value"}',
 *     },
 *   ],
 * });
 *
 * // Use the mock server in tests
 * await server.connect();
 * const result = await server.callTool('get_weather', { location: 'NYC' });
 * ```
 */
export declare class McpMocker {
    /** Map of mock servers by name */
    readonly servers: Map<string, MockMcpServer>;
    /** Track mocked modules */
    private readonly mockedModules;
    constructor(options?: McpMockerOptions);
    /**
     * Create a mock MCP server.
     *
     * @param name - Server name
     * @param config - Server configuration
     * @returns The mock server
     */
    mockServer(name: string, config?: Omit<MockMcpServerConfig, 'name'>): MockMcpServer;
    /**
     * Get a mock server by name.
     *
     * @param name - Server name
     * @returns The mock server or undefined
     */
    getServer(name: string): MockMcpServer | undefined;
    /**
     * Mock the MCP client module.
     *
     * @returns Mock client factory
     */
    mockClient(): Mock;
    /**
     * Mock all MCP-related modules.
     *
     * @returns Dictionary of mocked modules
     */
    mockAllModules(): Record<string, unknown>;
    /**
     * Create a mock tool that can be registered with servers.
     *
     * @param name - Tool name
     * @param handler - Tool handler
     * @param options - Additional options
     * @returns Tool definition
     */
    createMockTool(name: string, handler: (args: unknown) => unknown | Promise<unknown>, options?: {
        description?: string;
        inputSchema?: Record<string, unknown>;
    }): MockToolDefinition;
    /**
     * Create a mock resource that can be registered with servers.
     *
     * @param uri - Resource URI
     * @param content - Resource content
     * @param options - Additional options
     * @returns Resource definition
     */
    createMockResource(uri: string, content: string | Buffer, options?: {
        name?: string;
        description?: string;
        mimeType?: string;
    }): MockResourceDefinition;
    /**
     * Restore all mocked modules.
     */
    restoreAll(): void;
    /**
     * Reset all mock servers.
     */
    resetAll(): void;
}
/**
 * Factory function to create an McpMocker instance.
 *
 * @param options - Configuration options
 * @returns A new McpMocker instance
 */
export declare function createMcpMocker(options?: McpMockerOptions): McpMocker;
//# sourceMappingURL=mcp.d.ts.map