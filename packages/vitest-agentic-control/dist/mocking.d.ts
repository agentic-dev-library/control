/**
 * Core mocking utilities for agentic-control testing.
 *
 * This module provides the main `AgenticMocker` class that wraps Vitest's
 * mocking capabilities and provides convenience methods for mocking
 * agentic-control components.
 *
 * @module mocking
 */
import { type Mock } from 'vitest';
import { type McpMocker, type McpMockerOptions } from './mcp.js';
import { type ProviderMocker, type ProviderMockerOptions } from './providers.js';
import { type SandboxMocker, type SandboxMockerOptions } from './sandbox.js';
/**
 * Options for creating an AgenticMocker instance.
 */
export interface AgenticMockerOptions {
    /** Options for MCP mocking */
    mcp?: McpMockerOptions;
    /** Options for provider mocking */
    providers?: ProviderMockerOptions;
    /** Options for sandbox mocking */
    sandbox?: SandboxMockerOptions;
}
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
export declare class AgenticMocker {
    /** MCP mocking utilities */
    readonly mcp: McpMocker;
    /** AI provider mocking utilities */
    readonly providers: ProviderMocker;
    /** Sandbox execution mocking utilities */
    readonly sandbox: SandboxMocker;
    /** Track all mocked modules for cleanup */
    private readonly mockedModules;
    /** Track original module values */
    private readonly originalModules;
    /**
     * Creates a new AgenticMocker instance.
     *
     * @param options - Configuration options for the mocker
     */
    constructor(options?: AgenticMockerOptions);
    /**
     * Mock a module by path.
     *
     * @param modulePath - The module path to mock
     * @param mockValue - The mock value to use
     * @returns The mock value for chaining
     */
    mockModule<T extends Record<string, unknown>>(modulePath: string, mockValue: T): T;
    /**
     * Create a spy on a function.
     *
     * @param implementation - Optional implementation for the spy
     * @returns The mock function
     */
    createSpy<T extends (...args: unknown[]) => unknown>(implementation?: T): Mock<T>;
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
    mockAllFrameworks(): Record<string, unknown>;
    /**
     * Mock the GitHub client.
     *
     * @param options - Options for the mock
     * @returns The mock GitHub client
     */
    mockGitHubClient(options?: {
        issues?: unknown[];
        pullRequests?: unknown[];
        repositories?: unknown[];
    }): unknown;
    /**
     * Mock environment variables temporarily.
     *
     * @param env - Environment variables to set
     * @returns Cleanup function to restore original values
     */
    mockEnv(env: Record<string, string>): () => void;
    /**
     * Restore all mocked modules to their original values.
     */
    restoreAll(): void;
    /**
     * Reset all mocks without restoring.
     */
    resetAll(): void;
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
export declare function createAgenticMocker(options?: AgenticMockerOptions): AgenticMocker;
//# sourceMappingURL=mocking.d.ts.map