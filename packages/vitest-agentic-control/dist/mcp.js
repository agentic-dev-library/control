/**
 * MCP (Model Context Protocol) mocking utilities for agentic-control testing.
 *
 * This module provides utilities for mocking MCP servers, tools, and resources
 * during testing. It allows you to simulate MCP server behavior without
 * needing actual MCP server implementations.
 *
 * @module mcp
 */
import { vi } from 'vitest';
/**
 * List of MCP-related modules that can be mocked.
 */
export const MCP_MODULES = [
    '@modelcontextprotocol/sdk',
    '@modelcontextprotocol/sdk/client',
    '@modelcontextprotocol/sdk/server',
    '@ai-sdk/mcp',
];
/**
 * Mock MCP server instance.
 */
export class MockMcpServer {
    name;
    tools = new Map();
    resources = new Map();
    capabilities;
    connected = false;
    constructor(config) {
        this.name = config.name;
        this.capabilities = {
            tools: config.capabilities?.tools ?? true,
            resources: config.capabilities?.resources ?? true,
            prompts: config.capabilities?.prompts ?? false,
        };
        // Register tools
        for (const tool of config.tools ?? []) {
            this.registerTool(tool);
        }
        // Register resources
        for (const resource of config.resources ?? []) {
            this.registerResource(resource);
        }
    }
    /**
     * Register a tool with this mock server.
     */
    registerTool(definition) {
        const mockTool = {
            definition,
            handler: vi.fn(definition.handler),
            calls: [],
        };
        this.tools.set(definition.name, mockTool);
        return mockTool;
    }
    /**
     * Register a resource with this mock server.
     */
    registerResource(definition) {
        const mockResource = {
            definition,
            readCount: 0,
        };
        this.resources.set(definition.uri, mockResource);
        return mockResource;
    }
    /**
     * Connect to this mock server.
     */
    async connect() {
        this.connected = true;
    }
    /**
     * Disconnect from this mock server.
     */
    async disconnect() {
        this.connected = false;
    }
    /**
     * Check if connected.
     */
    isConnected() {
        return this.connected;
    }
    /**
     * List available tools.
     */
    async listTools() {
        return Array.from(this.tools.values()).map((tool) => ({
            name: tool.definition.name,
            description: tool.definition.description,
            inputSchema: tool.definition.inputSchema,
        }));
    }
    /**
     * Call a tool.
     */
    async callTool(name, args) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }
        tool.calls.push(args);
        return tool.handler(args);
    }
    /**
     * List available resources.
     */
    async listResources() {
        return Array.from(this.resources.values()).map((resource) => ({
            uri: resource.definition.uri,
            name: resource.definition.name,
            description: resource.definition.description,
            mimeType: resource.definition.mimeType,
        }));
    }
    /**
     * Read a resource.
     */
    async readResource(uri) {
        const resource = this.resources.get(uri);
        if (!resource) {
            throw new Error(`Resource not found: ${uri}`);
        }
        resource.readCount++;
        return {
            uri: resource.definition.uri,
            mimeType: resource.definition.mimeType,
            content: resource.definition.content,
        };
    }
    /**
     * Reset all call history.
     */
    reset() {
        for (const tool of this.tools.values()) {
            tool.handler.mockClear();
            tool.calls = [];
        }
        for (const resource of this.resources.values()) {
            resource.readCount = 0;
        }
    }
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
export class McpMocker {
    /** Map of mock servers by name */
    servers = new Map();
    /** Track mocked modules */
    mockedModules = new Set();
    constructor(options = {}) {
        if (options.autoMock) {
            this.mockAllModules();
        }
    }
    /**
     * Create a mock MCP server.
     *
     * @param name - Server name
     * @param config - Server configuration
     * @returns The mock server
     */
    mockServer(name, config = {}) {
        const server = new MockMcpServer({ name, ...config });
        this.servers.set(name, server);
        return server;
    }
    /**
     * Get a mock server by name.
     *
     * @param name - Server name
     * @returns The mock server or undefined
     */
    getServer(name) {
        return this.servers.get(name);
    }
    /**
     * Mock the MCP client module.
     *
     * @returns Mock client factory
     */
    mockClient() {
        const mockClientFactory = vi.fn((serverName) => {
            const server = this.servers.get(serverName);
            if (!server) {
                throw new Error(`No mock server registered: ${serverName}`);
            }
            return server;
        });
        vi.doMock('@modelcontextprotocol/sdk/client', () => ({
            Client: mockClientFactory,
        }));
        this.mockedModules.add('@modelcontextprotocol/sdk/client');
        return mockClientFactory;
    }
    /**
     * Mock all MCP-related modules.
     *
     * @returns Dictionary of mocked modules
     */
    mockAllModules() {
        const mocks = {};
        // Mock SDK client
        mocks['@modelcontextprotocol/sdk/client'] = {
            Client: vi.fn().mockImplementation((serverName) => {
                return this.servers.get(serverName) ?? new MockMcpServer({ name: serverName });
            }),
        };
        // Mock SDK server
        mocks['@modelcontextprotocol/sdk/server'] = {
            Server: vi.fn().mockImplementation((config) => {
                return new MockMcpServer(config);
            }),
        };
        // Mock AI SDK MCP integration
        mocks['@ai-sdk/mcp'] = {
            experimental_createMCPClient: vi.fn().mockImplementation(async (config) => {
                return this.servers.get(config.name) ?? new MockMcpServer({ name: config.name });
            }),
        };
        for (const [modulePath, mock] of Object.entries(mocks)) {
            vi.doMock(modulePath, () => mock);
            this.mockedModules.add(modulePath);
        }
        return mocks;
    }
    /**
     * Create a mock tool that can be registered with servers.
     *
     * @param name - Tool name
     * @param handler - Tool handler
     * @param options - Additional options
     * @returns Tool definition
     */
    createMockTool(name, handler, options = {}) {
        return {
            name,
            description: options.description,
            inputSchema: options.inputSchema,
            handler,
        };
    }
    /**
     * Create a mock resource that can be registered with servers.
     *
     * @param uri - Resource URI
     * @param content - Resource content
     * @param options - Additional options
     * @returns Resource definition
     */
    createMockResource(uri, content, options = {}) {
        return {
            uri,
            content,
            name: options.name,
            description: options.description,
            mimeType: options.mimeType,
        };
    }
    /**
     * Restore all mocked modules.
     */
    restoreAll() {
        this.mockedModules.clear();
        this.servers.clear();
    }
    /**
     * Reset all mock servers.
     */
    resetAll() {
        for (const server of this.servers.values()) {
            server.reset();
        }
    }
}
/**
 * Factory function to create an McpMocker instance.
 *
 * @param options - Configuration options
 * @returns A new McpMocker instance
 */
export function createMcpMocker(options = {}) {
    return new McpMocker(options);
}
//# sourceMappingURL=mcp.js.map