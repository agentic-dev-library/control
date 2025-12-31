/**
 * Core mocking utilities for agentic-control testing.
 *
 * This module provides the main `AgenticMocker` class that wraps Vitest's
 * mocking capabilities and provides convenience methods for mocking
 * agentic-control components.
 *
 * @module mocking
 */
import { vi } from 'vitest';
import { createMcpMocker } from './mcp.js';
import { createProviderMocker, } from './providers.js';
import { createSandboxMocker } from './sandbox.js';
/**
 * Main mocker class for comprehensive agentic-control testing.
 *
 * This class provides a unified interface for mocking all agentic-control
 * components: MCP servers, AI providers, sandbox execution, and more.
 *
 * @example Basic usage
 * ```typescript
 * import { AgenticMocker } from 'vitest-agentic-control';
 *
 * const mocker = new AgenticMocker();
 *
 * // Mock MCP server
 * mocker.mcp.mockServer('my-server', {
 *   tools: [{ name: 'tool1', handler: () => 'result' }],
 * });
 *
 * // Mock AI provider
 * mocker.providers.mockAnthropic({ response: 'Hello!' });
 *
 * // Mock sandbox execution
 * mocker.sandbox.mockExecution({ success: true, output: 'Done!' });
 *
 * // Clean up after test
 * mocker.restoreAll();
 * ```
 */
export class AgenticMocker {
    /** MCP mocking utilities */
    mcp;
    /** AI provider mocking utilities */
    providers;
    /** Sandbox execution mocking utilities */
    sandbox;
    /** Track all mocked modules for cleanup */
    mockedModules = new Map();
    /** Track original module values */
    originalModules = new Map();
    /**
     * Creates a new AgenticMocker instance.
     *
     * @param options - Configuration options for the mocker
     */
    constructor(options = {}) {
        this.mcp = createMcpMocker(options.mcp);
        this.providers = createProviderMocker(options.providers);
        this.sandbox = createSandboxMocker(options.sandbox);
    }
    /**
     * Mock a module by path.
     *
     * @param modulePath - The module path to mock
     * @param mockValue - The mock value to use
     * @returns The mock value for chaining
     */
    mockModule(modulePath, mockValue) {
        vi.doMock(modulePath, () => mockValue);
        this.mockedModules.set(modulePath, mockValue);
        return mockValue;
    }
    /**
     * Create a spy on a function.
     *
     * @param implementation - Optional implementation for the spy
     * @returns The mock function
     */
    createSpy(implementation) {
        return vi.fn(implementation);
    }
    /**
     * Mock all agentic-control framework modules.
     *
     * This mocks the common modules used in agentic-control:
     * - MCP SDK modules
     * - AI SDK modules
     * - GitHub client modules
     *
     * @returns Dictionary of all mocked modules
     */
    mockAllFrameworks() {
        const mocks = {};
        // Mock MCP modules
        const mcpMocks = this.mcp.mockAllModules();
        Object.assign(mocks, mcpMocks);
        // Mock provider modules
        const providerMocks = this.providers.mockAllModules();
        Object.assign(mocks, providerMocks);
        return mocks;
    }
    /**
     * Mock the GitHub client.
     *
     * @param options - Options for the mock
     * @returns The mock GitHub client
     */
    mockGitHubClient(options = {}) {
        const mockClient = {
            issues: {
                list: vi.fn().mockResolvedValue({ data: options.issues ?? [] }),
                get: vi.fn().mockResolvedValue({ data: options.issues?.[0] ?? {} }),
                create: vi.fn().mockResolvedValue({ data: { id: 1, number: 1 } }),
                update: vi.fn().mockResolvedValue({ data: {} }),
            },
            pulls: {
                list: vi.fn().mockResolvedValue({ data: options.pullRequests ?? [] }),
                get: vi.fn().mockResolvedValue({ data: options.pullRequests?.[0] ?? {} }),
                create: vi.fn().mockResolvedValue({ data: { id: 1, number: 1 } }),
            },
            repos: {
                get: vi.fn().mockResolvedValue({ data: options.repositories?.[0] ?? {} }),
                listForOrg: vi.fn().mockResolvedValue({ data: options.repositories ?? [] }),
            },
        };
        this.mockModule('@octokit/rest', { Octokit: vi.fn().mockReturnValue(mockClient) });
        return mockClient;
    }
    /**
     * Mock environment variables temporarily.
     *
     * @param env - Environment variables to set
     * @returns Cleanup function to restore original values
     */
    mockEnv(env) {
        const original = {};
        for (const [key, value] of Object.entries(env)) {
            original[key] = process.env[key];
            process.env[key] = value;
        }
        return () => {
            for (const [key, value] of Object.entries(original)) {
                if (value === undefined) {
                    delete process.env[key];
                }
                else {
                    process.env[key] = value;
                }
            }
        };
    }
    /**
     * Restore all mocked modules to their original values.
     */
    restoreAll() {
        // Clear our module tracking
        this.mockedModules.clear();
        this.originalModules.clear();
        // Restore sub-mockers
        this.mcp.restoreAll();
        this.providers.restoreAll();
        this.sandbox.restoreAll();
        // Clear all mocks and reset module cache
        vi.clearAllMocks();
        vi.resetModules();
    }
    /**
     * Reset all mocks without restoring.
     */
    resetAll() {
        vi.resetAllMocks();
        this.mcp.resetAll();
        this.providers.resetAll();
        this.sandbox.resetAll();
    }
}
/**
 * Factory function to create an AgenticMocker instance.
 *
 * @param options - Configuration options
 * @returns A new AgenticMocker instance
 *
 * @example
 * ```typescript
 * import { createAgenticMocker } from 'vitest-agentic-control';
 *
 * const mocker = createAgenticMocker();
 * mocker.mcp.mockServer('test', { tools: [] });
 * ```
 */
export function createAgenticMocker(options = {}) {
    return new AgenticMocker(options);
}
//# sourceMappingURL=mocking.js.map