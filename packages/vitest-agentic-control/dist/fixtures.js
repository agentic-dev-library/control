/**
 * Test fixtures for agentic-control testing.
 *
 * This module provides pre-configured test fixtures for common
 * agentic-control configurations, making it easy to set up tests.
 *
 * @module fixtures
 */
/**
 * Create a test configuration with sensible defaults.
 *
 * @param options - Configuration options
 * @returns A test configuration object
 *
 * @example
 * ```typescript
 * import { createTestConfig } from 'vitest-agentic-control';
 *
 * const config = createTestConfig({
 *   logLevel: 'debug',
 *   tokens: true,
 *   fleet: true,
 * });
 *
 * // Use in your tests
 * expect(config.tokens?.organizations).toBeDefined();
 * ```
 */
export function createTestConfig(options = {}) {
    const config = {
        logLevel: options.logLevel ?? 'info',
    };
    if (options.tokens !== false) {
        config.tokens = createTokenConfig();
    }
    if (options.fleet) {
        config.fleet = createFleetConfig();
    }
    if (options.triage) {
        config.triage = createTriageConfig();
    }
    if (options.sandbox) {
        config.sandbox = createSandboxConfig();
    }
    return config;
}
/**
 * Create a token configuration for testing.
 *
 * @param overrides - Optional overrides
 * @returns Token configuration
 *
 * @example
 * ```typescript
 * import { createTokenConfig } from 'vitest-agentic-control';
 *
 * const tokens = createTokenConfig({
 *   organizations: {
 *     'my-org': { name: 'my-org', tokenEnvVar: 'MY_ORG_TOKEN' },
 *   },
 * });
 * ```
 */
export function createTokenConfig(overrides = {}) {
    return {
        organizations: overrides.organizations ?? {
            'test-org': {
                name: 'test-org',
                tokenEnvVar: 'TEST_ORG_TOKEN',
            },
            'another-org': {
                name: 'another-org',
                tokenEnvVar: 'ANOTHER_ORG_TOKEN',
            },
        },
        defaultTokenEnvVar: overrides.defaultTokenEnvVar ?? 'GITHUB_TOKEN',
        prReviewTokenEnvVar: overrides.prReviewTokenEnvVar ?? 'GITHUB_TOKEN',
    };
}
/**
 * Create a fleet configuration for testing.
 *
 * @param overrides - Optional overrides
 * @returns Fleet configuration
 *
 * @example
 * ```typescript
 * import { createFleetConfig } from 'vitest-agentic-control';
 *
 * const fleet = createFleetConfig({
 *   concurrency: 5,
 *   timeout: 60000,
 * });
 * ```
 */
export function createFleetConfig(overrides = {}) {
    return {
        autoCreatePr: overrides.autoCreatePr ?? false,
        concurrency: overrides.concurrency ?? 3,
        timeout: overrides.timeout ?? 30000,
    };
}
/**
 * Create a triage configuration for testing.
 *
 * @param overrides - Optional overrides
 * @returns Triage configuration
 *
 * @example
 * ```typescript
 * import { createTriageConfig } from 'vitest-agentic-control';
 *
 * const triage = createTriageConfig({
 *   provider: 'openai',
 *   model: 'gpt-4',
 * });
 * ```
 */
export function createTriageConfig(overrides = {}) {
    return {
        provider: overrides.provider ?? 'anthropic',
        model: overrides.model ?? 'claude-sonnet-4-20250514',
        maxTokens: overrides.maxTokens ?? 4096,
        temperature: overrides.temperature ?? 0.7,
    };
}
/**
 * Create a sandbox configuration for testing.
 *
 * @param overrides - Optional overrides
 * @returns Sandbox configuration
 *
 * @example
 * ```typescript
 * import { createSandboxConfig } from 'vitest-agentic-control';
 *
 * const sandbox = createSandboxConfig({
 *   runtime: 'cursor',
 *   memory: 1024,
 * });
 * ```
 */
export function createSandboxConfig(overrides = {}) {
    return {
        runtime: overrides.runtime ?? 'claude',
        image: overrides.image ?? 'node:22-slim',
        memory: overrides.memory ?? 512,
        timeout: overrides.timeout ?? 30000,
        workdir: overrides.workdir ?? '/workspace',
    };
}
/**
 * Default test environment variables.
 */
export const DEFAULT_TEST_ENV = {
    GITHUB_TOKEN: 'ghp_test_token_12345',
    ANTHROPIC_API_KEY: 'sk-ant-test-key-12345',
    OPENAI_API_KEY: 'sk-test-key-12345',
    TEST_ORG_TOKEN: 'ghp_test_org_token_12345',
    ANOTHER_ORG_TOKEN: 'ghp_another_org_token_12345',
    PR_REVIEW_TOKEN: 'ghp_pr_review_token_12345',
};
/**
 * Set up test environment variables and return cleanup function.
 *
 * @param env - Environment variables to set
 * @returns Cleanup function to restore original values
 *
 * @example
 * ```typescript
 * import { withTestEnv, DEFAULT_TEST_ENV } from 'vitest-agentic-control';
 * import { beforeEach, afterEach } from 'vitest';
 *
 * describe('My Tests', () => {
 *   let cleanup: () => void;
 *
 *   beforeEach(() => {
 *     cleanup = withTestEnv(DEFAULT_TEST_ENV);
 *   });
 *
 *   afterEach(() => {
 *     cleanup();
 *   });
 *
 *   it('should use test tokens', () => {
 *     expect(process.env.GITHUB_TOKEN).toBe('ghp_test_token_12345');
 *   });
 * });
 * ```
 */
export function withTestEnv(env = DEFAULT_TEST_ENV) {
    const original = {};
    // Save original values and set new ones
    for (const [key, value] of Object.entries(env)) {
        original[key] = process.env[key];
        if (value !== undefined) {
            process.env[key] = value;
        }
        else {
            delete process.env[key];
        }
    }
    // Return cleanup function
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
 * Create a mock agent configuration for testing.
 *
 * @returns Agent configuration
 */
export function createMockAgentConfig() {
    return {
        name: 'test-agent',
        role: 'Test Agent',
        goal: 'Complete test tasks accurately and efficiently',
        backstory: 'You are a helpful test agent designed for testing purposes.',
    };
}
/**
 * Create a mock task configuration for testing.
 *
 * @returns Task configuration
 */
export function createMockTaskConfig() {
    return {
        name: 'test-task',
        description: 'Complete the test task by following the instructions.',
        expectedOutput: 'A successful completion message.',
        agent: 'test-agent',
    };
}
/**
 * Create a mock crew configuration for testing.
 *
 * @returns Crew configuration
 */
export function createMockCrewConfig() {
    return {
        name: 'test-crew',
        description: 'A test crew for testing purposes',
        agents: {
            'test-agent': createMockAgentConfig(),
        },
        tasks: {
            'test-task': createMockTaskConfig(),
        },
    };
}
/**
 * Create a mock GitHub issue for testing.
 *
 * @param overrides - Optional overrides
 * @returns GitHub issue object
 */
export function createMockGitHubIssue(overrides = {}) {
    return {
        number: overrides.number ?? 1,
        title: overrides.title ?? 'Test Issue',
        body: overrides.body ?? 'This is a test issue body.',
        state: overrides.state ?? 'open',
        labels: (overrides.labels ?? ['bug']).map((name) => ({ name })),
        user: { login: 'test-user' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}
/**
 * Create a mock GitHub pull request for testing.
 *
 * @param overrides - Optional overrides
 * @returns GitHub pull request object
 */
export function createMockGitHubPR(overrides = {}) {
    const state = overrides.state ?? 'open';
    return {
        number: overrides.number ?? 1,
        title: overrides.title ?? 'Test Pull Request',
        body: overrides.body ?? 'This is a test PR body.',
        state: state === 'merged' ? 'closed' : state,
        merged: state === 'merged',
        base: { ref: overrides.base ?? 'main' },
        head: { ref: overrides.head ?? 'feature/test' },
        labels: (overrides.labels ?? ['enhancement']).map((name) => ({ name })),
        user: { login: 'test-user' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}
//# sourceMappingURL=fixtures.js.map