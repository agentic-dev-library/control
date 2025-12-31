/**
 * Sandbox execution mocking utilities for agentic-control testing.
 *
 * This module provides utilities for mocking Docker container execution
 * and sandbox operations during testing. It allows you to simulate
 * container behavior without needing actual Docker.
 *
 * @module sandbox
 */
import { vi } from 'vitest';
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
export class SandboxMocker {
    /** Default container configuration */
    defaultConfig;
    /** Default execution result */
    defaultResult;
    /** Track mock containers */
    containers = new Map();
    /** Track mocked modules */
    mockedModules = new Set();
    /** Queue of results to return from executions */
    resultQueue = [];
    /** Counter for generating container IDs */
    containerIdCounter = 0;
    constructor(options = {}) {
        this.defaultConfig = options.defaultConfig ?? {
            image: 'node:22-slim',
            workdir: '/workspace',
        };
        this.defaultResult = options.defaultResult ?? {
            success: true,
            exitCode: 0,
            stdout: '',
            stderr: '',
        };
        if (options.autoMock) {
            this.mockDockerCommands();
        }
    }
    /**
     * Set the default execution result.
     *
     * @param result - The result to return from executions
     */
    mockExecution(result) {
        this.defaultResult = result;
    }
    /**
     * Queue a result to be returned from the next execution.
     *
     * @param result - The result to queue
     */
    queueResult(result) {
        this.resultQueue.push(result);
    }
    /**
     * Queue multiple results to be returned from executions.
     *
     * @param results - The results to queue
     */
    queueResults(results) {
        this.resultQueue.push(...results);
    }
    /**
     * Get the next result from the queue or the default.
     */
    getNextResult() {
        return this.resultQueue.shift() ?? this.defaultResult;
    }
    /**
     * Create a mock container.
     *
     * @param config - Container configuration
     * @returns Mock container instance
     */
    createMockContainer(config = {}) {
        const mergedConfig = {
            ...this.defaultConfig,
            ...config,
            id: config.id ?? `mock-container-${++this.containerIdCounter}`,
            name: config.name ?? `mock-container-${this.containerIdCounter}`,
        };
        const containerId = mergedConfig.id || 'unknown';
        const container = {
            config: mergedConfig,
            status: 'created',
            executions: [],
            start: vi.fn(async () => {
                container.status = 'running';
            }),
            stop: vi.fn(async () => {
                container.status = 'stopped';
            }),
            exec: vi.fn(async (command) => {
                const result = this.getNextResult();
                container.executions.push({
                    command,
                    result,
                    timestamp: new Date(),
                });
                if (result.error) {
                    throw result.error;
                }
                return result;
            }),
            remove: vi.fn(async () => {
                container.status = 'removed';
                this.containers.delete(containerId);
            }),
            copyTo: vi.fn(async () => {
                // Mock file copy to container
            }),
            copyFrom: vi.fn(async () => {
                // Mock file copy from container
            }),
        };
        this.containers.set(containerId, container);
        return container;
    }
    /**
     * Mock Docker CLI commands.
     */
    mockDockerCommands() {
        // Mock child_process for Docker commands
        vi.doMock('child_process', () => ({
            spawn: vi.fn((command, args) => {
                const isDocker = command === 'docker' || command.includes('docker');
                if (isDocker) {
                    return this.createMockDockerProcess(args);
                }
                // Return a basic mock process for non-Docker commands
                return {
                    stdout: { on: vi.fn() },
                    stderr: { on: vi.fn() },
                    on: vi.fn((event, cb) => {
                        if (event === 'close') {
                            cb(0);
                        }
                    }),
                    kill: vi.fn(),
                };
            }),
            spawnSync: vi.fn((command, _args) => {
                const isDocker = command === 'docker' || command.includes('docker');
                if (isDocker) {
                    const result = this.getNextResult();
                    return {
                        status: result.exitCode ?? 0,
                        stdout: Buffer.from(result.stdout ?? ''),
                        stderr: Buffer.from(result.stderr ?? ''),
                        error: result.error,
                    };
                }
                return {
                    status: 0,
                    stdout: Buffer.from(''),
                    stderr: Buffer.from(''),
                };
            }),
            execSync: vi.fn((command) => {
                if (command.includes('docker')) {
                    return this.defaultResult.stdout ?? '';
                }
                return '';
            }),
        }));
        this.mockedModules.add('child_process');
    }
    /**
     * Create a mock Docker process.
     */
    createMockDockerProcess(args) {
        const result = this.getNextResult();
        // Parse Docker command
        const subcommand = args[0];
        const process = {
            stdout: {
                on: vi.fn((event, cb) => {
                    if (event === 'data' && result.stdout) {
                        cb(Buffer.from(result.stdout));
                    }
                }),
            },
            stderr: {
                on: vi.fn((event, cb) => {
                    if (event === 'data' && result.stderr) {
                        cb(Buffer.from(result.stderr));
                    }
                }),
            },
            on: vi.fn((event, cb) => {
                if (event === 'close') {
                    setTimeout(() => cb(result.exitCode ?? 0), 10);
                }
            }),
            kill: vi.fn(),
        };
        // Handle specific Docker commands
        if (subcommand === 'run') {
            // Create a mock container when docker run is called
            const container = this.createMockContainer({
                image: args.find((_a, i) => args[i - 1] === '--image') ?? 'unknown',
            });
            container.status = 'running';
        }
        return process;
    }
    /**
     * Mock the ContainerManager class from agentic-control.
     */
    mockContainerManager() {
        const mockManager = vi.fn().mockImplementation(() => ({
            createContainer: vi.fn(async (config) => {
                return this.createMockContainer(config);
            }),
            startContainer: vi.fn(async (id) => {
                const container = this.containers.get(id);
                if (container) {
                    await container.start();
                }
            }),
            stopContainer: vi.fn(async (id) => {
                const container = this.containers.get(id);
                if (container) {
                    await container.stop();
                }
            }),
            removeContainer: vi.fn(async (id) => {
                const container = this.containers.get(id);
                if (container) {
                    await container.remove();
                }
            }),
            execInContainer: vi.fn(async (id, command) => {
                const container = this.containers.get(id);
                if (container) {
                    return container.exec(command);
                }
                throw new Error(`Container not found: ${id}`);
            }),
        }));
        vi.doMock('agentic-control/sandbox', () => ({
            ContainerManager: mockManager,
        }));
        this.mockedModules.add('agentic-control/sandbox');
        return mockManager;
    }
    /**
     * Mock the SandboxExecutor class from agentic-control.
     */
    mockSandboxExecutor() {
        const mockExecutor = vi.fn().mockImplementation(() => ({
            execute: vi.fn(async () => {
                return this.getNextResult();
            }),
            executeWithTimeout: vi.fn(async () => {
                return this.getNextResult();
            }),
        }));
        vi.doMock('agentic-control/sandbox', () => ({
            SandboxExecutor: mockExecutor,
        }));
        this.mockedModules.add('agentic-control/sandbox');
        return mockExecutor;
    }
    /**
     * Create a mock runtime adapter.
     *
     * @param name - Runtime name
     * @param command - Command to return from prepareCommand
     */
    createMockRuntime(name, command = ['echo', 'mock']) {
        return {
            name,
            prepareCommand: vi.fn(() => command),
            parseOutput: vi.fn((output) => ({ output })),
        };
    }
    /**
     * Get all container IDs.
     */
    getContainerIds() {
        return Array.from(this.containers.keys());
    }
    /**
     * Get a container by ID.
     */
    getContainer(id) {
        return this.containers.get(id);
    }
    /**
     * Restore all mocked modules.
     */
    restoreAll() {
        this.mockedModules.clear();
        this.containers.clear();
        this.resultQueue = [];
    }
    /**
     * Reset all mocks.
     */
    resetAll() {
        for (const container of this.containers.values()) {
            container.start.mockClear();
            container.stop.mockClear();
            container.exec.mockClear();
            container.remove.mockClear();
            container.copyTo.mockClear();
            container.copyFrom.mockClear();
            container.executions = [];
        }
        this.resultQueue = [];
    }
}
/**
 * Factory function to create a SandboxMocker instance.
 *
 * @param options - Configuration options
 * @returns A new SandboxMocker instance
 */
export function createSandboxMocker(options = {}) {
    return new SandboxMocker(options);
}
//# sourceMappingURL=sandbox.js.map