/**
 * Vitest plugin with fixtures and utilities for agentic-control E2E testing.
 *
 * This package provides test utilities and mocking fixtures for building
 * E2E tests with agentic-control components (MCP, providers, sandbox, fleet).
 *
 * @packageDocumentation
 *
 * @example Installation
 * ```bash
 * pnpm add -D vitest-agentic-control
 * ```
 *
 * @example Basic Usage
 * ```typescript
 * import { describe, it, expect } from 'vitest';
 * import { createMcpMocker, createProviderMocker } from 'vitest-agentic-control';
 *
 * describe('My MCP Tests', () => {
 *   it('should mock MCP server', async () => {
 *     const mocker = createMcpMocker();
 *     mocker.mockServer('test-server', {
 *       tools: [{ name: 'test-tool', handler: () => ({ result: 'ok' }) }],
 *     });
 *
 *     // Your test code here
 *   });
 * });
 * ```
 *
 * @example Provider Mocking
 * ```typescript
 * import { createProviderMocker } from 'vitest-agentic-control';
 *
 * const mocker = createProviderMocker();
 * mocker.mockAnthropic({ response: 'Mocked Claude response' });
 * mocker.mockOpenAI({ response: 'Mocked GPT response' });
 * ```
 *
 * Available exports:
 *   - `AgenticMocker` - Main mocker class for comprehensive mocking
 *   - `createMcpMocker` - Factory for MCP server mocking
 *   - `createProviderMocker` - Factory for AI provider mocking
 *   - `createSandboxMocker` - Factory for sandbox execution mocking
 *   - Test fixtures for configs and environment setup
 */

// Main mocker class
export { AgenticMocker, createAgenticMocker } from './mocking.js';

// MCP mocking utilities
export {
    McpMocker,
    createMcpMocker,
    MockMcpServer,
    MockMcpTool,
    MockMcpResource,
    type McpMockerOptions,
    type MockToolDefinition,
    type MockResourceDefinition,
} from './mcp.js';

// Provider mocking utilities
export {
    ProviderMocker,
    createProviderMocker,
    SUPPORTED_PROVIDERS,
    type ProviderMockerOptions,
    type MockProviderResponse,
    type MockStreamChunk,
} from './providers.js';

// Sandbox mocking utilities
export {
    SandboxMocker,
    createSandboxMocker,
    type SandboxMockerOptions,
    type MockContainerConfig,
    type MockExecutionResult,
} from './sandbox.js';

// Test fixtures
export {
    createTestConfig,
    createFleetConfig,
    createTriageConfig,
    createTokenConfig,
    createSandboxConfig,
    withTestEnv,
    DEFAULT_TEST_ENV,
    createMockAgentConfig,
    createMockTaskConfig,
    createMockCrewConfig,
    createMockGitHubIssue,
    createMockGitHubPR,
    type TestConfigOptions,
    type TestConfig,
    type TestTokenConfig,
    type TestFleetConfig,
    type TestTriageConfig,
    type TestSandboxConfig,
    type TestEnvSetup,
} from './fixtures.js';

// Version
export const VERSION = '1.0.0';
