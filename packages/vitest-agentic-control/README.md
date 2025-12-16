# vitest-agentic-control

Vitest plugin with fixtures and utilities for agentic-control E2E testing.

## Installation

```bash
pnpm add -D vitest-agentic-control
```

## Features

- **MCP Mocking**: Mock MCP servers, tools, and resources without real implementations
- **Provider Mocking**: Mock AI providers (Anthropic, OpenAI, Google, Mistral, Azure, Ollama)
- **Sandbox Mocking**: Mock Docker container execution and sandbox operations
- **Test Fixtures**: Pre-configured fixtures for tokens, fleet, triage, and sandbox
- **Environment Helpers**: Easy setup and cleanup of test environment variables

## Quick Start

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    createAgenticMocker,
    withTestEnv,
    DEFAULT_TEST_ENV,
} from 'vitest-agentic-control';

describe('My Agentic Tests', () => {
    let cleanup: () => void;
    let mocker: ReturnType<typeof createAgenticMocker>;

    beforeEach(() => {
        // Set up test environment
        cleanup = withTestEnv(DEFAULT_TEST_ENV);
        mocker = createAgenticMocker();
    });

    afterEach(() => {
        // Clean up
        mocker.restoreAll();
        cleanup();
    });

    it('should mock MCP server', async () => {
        const server = mocker.mcp.mockServer('test-server', {
            tools: [
                {
                    name: 'get_data',
                    handler: () => ({ data: 'mocked' }),
                },
            ],
        });

        await server.connect();
        const result = await server.callTool('get_data', {});
        expect(result).toEqual({ data: 'mocked' });
    });

    it('should mock AI provider', async () => {
        mocker.providers.mockAnthropic({
            response: 'Hello from mocked Claude!',
        });

        // Your test code that uses Anthropic
    });

    it('should mock sandbox execution', async () => {
        mocker.sandbox.mockExecution({
            success: true,
            stdout: 'Task completed successfully',
            exitCode: 0,
        });

        const container = mocker.sandbox.createMockContainer({
            image: 'node:22',
        });

        await container.start();
        const result = await container.exec(['npm', 'test']);
        expect(result.success).toBe(true);
    });
});
```

## MCP Mocking

```typescript
import { createMcpMocker } from 'vitest-agentic-control';

const mcpMocker = createMcpMocker();

// Create a mock MCP server with tools and resources
const server = mcpMocker.mockServer('my-server', {
    tools: [
        {
            name: 'search',
            description: 'Search for documents',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string' },
                },
            },
            handler: (args) => ({
                results: ['doc1', 'doc2'],
            }),
        },
    ],
    resources: [
        {
            uri: 'file:///config.json',
            content: '{"key": "value"}',
            mimeType: 'application/json',
        },
    ],
});

// Use the mock server
await server.connect();
const tools = await server.listTools();
const result = await server.callTool('search', { query: 'test' });
```

## Provider Mocking

```typescript
import { createProviderMocker } from 'vitest-agentic-control';

const providerMocker = createProviderMocker();

// Mock Anthropic
providerMocker.mockAnthropic({
    response: 'Hello! I am Claude.',
    usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
    },
});

// Mock OpenAI with streaming
providerMocker.mockOpenAI({
    response: 'Hello! I am GPT.',
    stream: true,
});

// Mock with simulated latency
providerMocker.mockGoogle({
    response: 'Hello! I am Gemini.',
    latency: 500, // 500ms delay
});

// Mock with error
providerMocker.mockMistral({
    error: new Error('Rate limit exceeded'),
});
```

## Sandbox Mocking

```typescript
import { createSandboxMocker } from 'vitest-agentic-control';

const sandboxMocker = createSandboxMocker();

// Set default execution result
sandboxMocker.mockExecution({
    success: true,
    stdout: 'Build completed',
    exitCode: 0,
});

// Queue multiple results for sequential executions
sandboxMocker.queueResults([
    { success: true, stdout: 'Step 1 done', exitCode: 0 },
    { success: true, stdout: 'Step 2 done', exitCode: 0 },
    { success: false, stderr: 'Step 3 failed', exitCode: 1 },
]);

// Create and use mock container
const container = sandboxMocker.createMockContainer({
    image: 'python:3.11',
    workdir: '/app',
    memory: 512,
});

await container.start();
const result1 = await container.exec(['pip', 'install', '-r', 'requirements.txt']);
const result2 = await container.exec(['python', 'main.py']);
await container.stop();
```

## Test Fixtures

```typescript
import {
    createTestConfig,
    createTokenConfig,
    createFleetConfig,
    createTriageConfig,
    createSandboxConfig,
    createMockGitHubIssue,
    createMockGitHubPR,
} from 'vitest-agentic-control';

// Create full test configuration
const config = createTestConfig({
    logLevel: 'debug',
    tokens: true,
    fleet: true,
    triage: true,
    sandbox: true,
});

// Create individual configs with overrides
const tokens = createTokenConfig({
    organizations: {
        'my-org': { name: 'my-org', tokenEnvVar: 'MY_ORG_TOKEN' },
    },
});

const triage = createTriageConfig({
    provider: 'openai',
    model: 'gpt-4-turbo',
});

// Create mock GitHub objects
const issue = createMockGitHubIssue({
    number: 42,
    title: 'Fix the bug',
    labels: ['bug', 'priority:high'],
});

const pr = createMockGitHubPR({
    number: 123,
    title: 'Add new feature',
    state: 'open',
    labels: ['enhancement'],
});
```

## Environment Setup

```typescript
import { withTestEnv, DEFAULT_TEST_ENV } from 'vitest-agentic-control';
import { beforeEach, afterEach } from 'vitest';

describe('Tests with environment', () => {
    let cleanup: () => void;

    beforeEach(() => {
        // Set up test environment. You can use the defaults:
        // cleanup = withTestEnv(DEFAULT_TEST_ENV);
        
        // Or provide custom values:
        cleanup = withTestEnv({
            GITHUB_TOKEN: 'custom-token',
            ANTHROPIC_API_KEY: 'custom-api-key',
            MY_CUSTOM_VAR: 'custom-value',
        });
    });

    afterEach(() => {
        cleanup();
    });

    it('should have test tokens available', () => {
        expect(process.env.GITHUB_TOKEN).toBeDefined();
    });
});
```

## API Reference

### Main Mocker

- `createAgenticMocker(options?)` - Create the main mocker instance
- `AgenticMocker.mcp` - MCP mocking utilities
- `AgenticMocker.providers` - Provider mocking utilities
- `AgenticMocker.sandbox` - Sandbox mocking utilities
- `AgenticMocker.mockEnv(env)` - Mock environment variables
- `AgenticMocker.mockGitHubClient(options?)` - Mock GitHub client
- `AgenticMocker.restoreAll()` - Restore all mocks

### MCP Mocking

- `createMcpMocker(options?)` - Create MCP mocker
- `McpMocker.mockServer(name, config)` - Create mock MCP server
- `McpMocker.mockClient()` - Mock MCP client module
- `McpMocker.createMockTool(name, handler, options?)` - Create mock tool
- `McpMocker.createMockResource(uri, content, options?)` - Create mock resource

### Provider Mocking

- `createProviderMocker(options?)` - Create provider mocker
- `ProviderMocker.mockAnthropic(config?)` - Mock Anthropic
- `ProviderMocker.mockOpenAI(config?)` - Mock OpenAI
- `ProviderMocker.mockGoogle(config?)` - Mock Google
- `ProviderMocker.mockMistral(config?)` - Mock Mistral
- `ProviderMocker.mockAzure(config?)` - Mock Azure
- `ProviderMocker.mockOllama(config?)` - Mock Ollama
- `ProviderMocker.createMockModel(provider, modelId, config?)` - Create mock model

### Sandbox Mocking

- `createSandboxMocker(options?)` - Create sandbox mocker
- `SandboxMocker.mockExecution(result)` - Set default execution result
- `SandboxMocker.queueResult(result)` - Queue execution result
- `SandboxMocker.createMockContainer(config?)` - Create mock container
- `SandboxMocker.mockDockerCommands()` - Mock Docker CLI commands
- `SandboxMocker.mockContainerManager()` - Mock ContainerManager class

### Fixtures

- `createTestConfig(options?)` - Create full test configuration
- `createTokenConfig(overrides?)` - Create token configuration
- `createFleetConfig(overrides?)` - Create fleet configuration
- `createTriageConfig(overrides?)` - Create triage configuration
- `createSandboxConfig(overrides?)` - Create sandbox configuration
- `withTestEnv(env?)` - Set up test environment
- `createMockGitHubIssue(overrides?)` - Create mock GitHub issue
- `createMockGitHubPR(overrides?)` - Create mock GitHub PR

## License

MIT
