/**
 * AI Provider mocking utilities for agentic-control testing.
 *
 * This module provides utilities for mocking AI providers (Anthropic, OpenAI,
 * Google, Mistral, Azure, Ollama) during testing. It allows you to simulate
 * AI model responses without making actual API calls.
 *
 * @module providers
 */
import { type Mock } from 'vitest';
/**
 * List of supported AI providers.
 */
export declare const SUPPORTED_PROVIDERS: readonly ["anthropic", "openai", "google", "mistral", "azure", "ollama"];
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];
/**
 * Provider module paths for mocking.
 */
export declare const PROVIDER_MODULES: Record<SupportedProvider, string>;
/**
 * Common AI SDK modules.
 */
export declare const AI_SDK_MODULES: readonly ["ai", "ai/rsc"];
/**
 * Mock provider response configuration.
 */
export interface MockProviderResponse {
    /** The text response to return */
    response?: string;
    /** Tool calls to include in response */
    toolCalls?: Array<{
        name: string;
        args: Record<string, unknown>;
    }>;
    /** Whether the response should stream */
    stream?: boolean;
    /** Simulated latency in ms */
    latency?: number;
    /** Error to throw instead of returning response */
    error?: Error;
    /** Usage information */
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
/**
 * Mock stream chunk for streaming responses.
 */
export interface MockStreamChunk {
    /** Text delta */
    textDelta?: string;
    /** Tool call start */
    toolCallStart?: {
        name: string;
        id: string;
    };
    /** Tool call delta (args) */
    toolCallDelta?: {
        id: string;
        args: string;
    };
    /** Whether this is the final chunk */
    isFinished?: boolean;
}
/**
 * Options for creating a ProviderMocker instance.
 */
export interface ProviderMockerOptions {
    /** Default response for all providers */
    defaultResponse?: MockProviderResponse;
    /** Whether to auto-mock all provider modules */
    autoMock?: boolean;
}
/**
 * Mock model instance for a provider.
 */
interface MockModel {
    /** Generate a response */
    generate: Mock<(prompt: string, options?: unknown) => Promise<unknown>>;
    /** Generate a streaming response */
    generateStream: Mock<(prompt: string, options?: unknown) => AsyncGenerator<MockStreamChunk>>;
    /** The provider this model belongs to */
    provider: SupportedProvider;
    /** Model ID */
    modelId: string;
}
/**
 * AI Provider mocking utilities class.
 *
 * Provides methods for mocking AI provider responses during testing.
 *
 * @example
 * ```typescript
 * import { ProviderMocker } from 'vitest-agentic-control';
 *
 * const mocker = new ProviderMocker();
 *
 * // Mock Anthropic provider
 * mocker.mockAnthropic({
 *   response: 'Hello! I am Claude.',
 *   usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
 * });
 *
 * // Mock OpenAI provider with streaming
 * mocker.mockOpenAI({
 *   response: 'Hello! I am GPT.',
 *   stream: true,
 * });
 *
 * // Mock a specific model
 * const model = mocker.createMockModel('anthropic', 'claude-sonnet-4-20250514');
 * ```
 */
export declare class ProviderMocker {
    /** Default response configuration */
    private defaultResponse;
    /** Track mocked modules */
    private readonly mockedModules;
    /** Track provider-specific configurations */
    private readonly providerConfigs;
    /** Track mock models */
    readonly models: Map<string, MockModel>;
    constructor(options?: ProviderMockerOptions);
    /**
     * Mock the Anthropic provider.
     *
     * @param config - Response configuration
     */
    mockAnthropic(config?: MockProviderResponse): void;
    /**
     * Mock the OpenAI provider.
     *
     * @param config - Response configuration
     */
    mockOpenAI(config?: MockProviderResponse): void;
    /**
     * Mock the Google provider.
     *
     * @param config - Response configuration
     */
    mockGoogle(config?: MockProviderResponse): void;
    /**
     * Mock the Mistral provider.
     *
     * @param config - Response configuration
     */
    mockMistral(config?: MockProviderResponse): void;
    /**
     * Mock the Azure provider.
     *
     * @param config - Response configuration
     */
    mockAzure(config?: MockProviderResponse): void;
    /**
     * Mock the Ollama provider.
     *
     * @param config - Response configuration
     */
    mockOllama(config?: MockProviderResponse): void;
    /**
     * Mock a specific provider module.
     *
     * @param provider - The provider to mock
     */
    private mockProviderModule;
    /**
     * Create a mock provider factory function.
     *
     * @param provider - The provider type
     * @param config - Response configuration
     * @returns Mock provider factory
     */
    private createMockProviderFactory;
    /**
     * Create a mock model for a provider.
     *
     * @param provider - The provider type
     * @param modelId - The model ID
     * @param config - Response configuration
     * @returns Mock model instance
     */
    createMockModel(provider: SupportedProvider, modelId: string, config?: MockProviderResponse): MockModel;
    /**
     * Mock the core AI SDK module.
     */
    mockAiSdk(): void;
    /**
     * Mock all provider modules.
     *
     * @returns Dictionary of mocked modules
     */
    mockAllModules(): Record<string, unknown>;
    /**
     * Set a response for a specific provider.
     *
     * @param provider - The provider
     * @param config - Response configuration
     */
    setProviderResponse(provider: SupportedProvider, config: MockProviderResponse): void;
    /**
     * Get the configuration for a provider.
     *
     * @param provider - The provider
     * @returns The configuration or undefined
     */
    getProviderConfig(provider: SupportedProvider): MockProviderResponse | undefined;
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
 * Factory function to create a ProviderMocker instance.
 *
 * @param options - Configuration options
 * @returns A new ProviderMocker instance
 */
export declare function createProviderMocker(options?: ProviderMockerOptions): ProviderMocker;
export {};
//# sourceMappingURL=providers.d.ts.map