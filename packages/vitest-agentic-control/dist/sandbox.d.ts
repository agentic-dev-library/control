/**
 * Sandbox execution mocking utilities for agentic-control testing.
 *
 * This module provides utilities for mocking Docker container execution
 * and sandbox operations during testing. It allows you to simulate
 * container behavior without needing actual Docker.
 *
 * @module sandbox
 */
import { type Mock } from 'vitest';
/**
 * Mock container configuration.
 */
export interface MockContainerConfig {
    /** Container ID */
    id?: string;
    /** Container name */
    name?: string;
    /** Image name */
    image?: string;
    /** Working directory */
    workdir?: string;
    /** Environment variables */
    env?: Record<string, string>;
    /** Memory limit in MB */
    memory?: number;
    /** Timeout in ms */
    timeout?: number;
}
/**
 * Mock execution result.
 */
export interface MockExecutionResult {
    /** Whether execution succeeded */
    success: boolean;
    /** Exit code */
    exitCode?: number;
    /** Standard output */
    stdout?: string;
    /** Standard error */
    stderr?: string;
    /** Output files */
    files?: Array<{
        path: string;
        content: string | Buffer;
    }>;
    /** Execution duration in ms */
    duration?: number;
    /** Error if execution failed */
    error?: Error;
}
/**
 * Options for creating a SandboxMocker instance.
 */
export interface SandboxMockerOptions {
    /** Default container configuration */
    defaultConfig?: MockContainerConfig;
    /** Default execution result */
    defaultResult?: MockExecutionResult;
    /** Whether to auto-mock Docker commands */
    autoMock?: boolean;
}
/**
 * Mock container instance.
 */
export interface MockContainer {
    /** Container configuration */
    config: MockContainerConfig;
    /** Container status */
    status: 'created' | 'running' | 'stopped' | 'removed';
    /** Execution history */
    executions: Array<{
        command: string[];
        result: MockExecutionResult;
        timestamp: Date;
    }>;
    /** Mock methods */
    start: Mock<() => Promise<void>>;
    stop: Mock<() => Promise<void>>;
    exec: Mock<(command: string[]) => Promise<MockExecutionResult>>;
    remove: Mock<() => Promise<void>>;
    copyTo: Mock<(hostPath: string, containerPath: string) => Promise<void>>;
    copyFrom: Mock<(containerPath: string, hostPath: string) => Promise<void>>;
}
/**
 * Sandbox execution mocking utilities class.
 *
 * Provides methods for mocking Docker container execution during testing.
 *
 * @example
 * ```typescript
 * import { SandboxMocker } from 'vitest-agentic-control';
 *
 * const mocker = new SandboxMocker();
 *
 * // Mock successful execution
 * mocker.mockExecution({
 *   success: true,
 *   stdout: 'Hello from container!',
 *   exitCode: 0,
 * });
 *
 * // Create a mock container
 * const container = mocker.createMockContainer({
 *   image: 'node:22',
 *   workdir: '/app',
 * });
 *
 * // Execute command in mock container
 * const result = await container.exec(['npm', 'test']);
 * expect(result.success).toBe(true);
 * ```
 */
export declare class SandboxMocker {
    /** Default container configuration */
    private defaultConfig;
    /** Default execution result */
    private defaultResult;
    /** Track mock containers */
    readonly containers: Map<string, MockContainer>;
    /** Track mocked modules */
    private readonly mockedModules;
    /** Queue of results to return from executions */
    private resultQueue;
    /** Counter for generating container IDs */
    private containerIdCounter;
    constructor(options?: SandboxMockerOptions);
    /**
     * Set the default execution result.
     *
     * @param result - The result to return from executions
     */
    mockExecution(result: MockExecutionResult): void;
    /**
     * Queue a result to be returned from the next execution.
     *
     * @param result - The result to queue
     */
    queueResult(result: MockExecutionResult): void;
    /**
     * Queue multiple results to be returned from executions.
     *
     * @param results - The results to queue
     */
    queueResults(results: MockExecutionResult[]): void;
    /**
     * Get the next result from the queue or the default.
     */
    private getNextResult;
    /**
     * Create a mock container.
     *
     * @param config - Container configuration
     * @returns Mock container instance
     */
    createMockContainer(config?: MockContainerConfig): MockContainer;
    /**
     * Mock Docker CLI commands.
     */
    mockDockerCommands(): void;
    /**
     * Create a mock Docker process.
     */
    private createMockDockerProcess;
    /**
     * Mock the ContainerManager class from agentic-control.
     */
    mockContainerManager(): Mock;
    /**
     * Mock the SandboxExecutor class from agentic-control.
     */
    mockSandboxExecutor(): Mock;
    /**
     * Create a mock runtime adapter.
     *
     * @param name - Runtime name
     * @param command - Command to return from prepareCommand
     */
    createMockRuntime(name: string, command?: string[]): {
        name: string;
        prepareCommand: Mock<(prompt: string, options?: unknown) => string[]>;
        parseOutput: Mock<(output: string) => unknown>;
    };
    /**
     * Get all container IDs.
     */
    getContainerIds(): string[];
    /**
     * Get a container by ID.
     */
    getContainer(id: string): MockContainer | undefined;
    /**
     * Restore all mocked modules.
     */
    restoreAll(): void;
    /**
     * Reset all mocks.
     */
    resetAll(): void;
}
/**
 * Factory function to create a SandboxMocker instance.
 *
 * @param options - Configuration options
 * @returns A new SandboxMocker instance
 */
export declare function createSandboxMocker(options?: SandboxMockerOptions): SandboxMocker;
//# sourceMappingURL=sandbox.d.ts.map