/**
 * AI Provider Loading - Shared provider utilities
 *
 * Supports multiple AI providers via Vercel AI SDK:
 * - anthropic (@ai-sdk/anthropic)
 * - openai (@ai-sdk/openai)
 * - google (@ai-sdk/google)
 * - mistral (@ai-sdk/mistral)
 * - azure (@ai-sdk/azure)
 * - ollama (ai-sdk-ollama) - for Ollama Cloud and local Ollama
 *
 * Install the provider you need:
 *   pnpm add @ai-sdk/anthropic
 *   pnpm add ai-sdk-ollama  # for Ollama support
 */
export type ProviderFactory = (config: {
    apiKey: string;
}) => unknown;
export type ModelFactory = (model: string) => unknown;
export type SupportedProvider = 'anthropic' | 'openai' | 'google' | 'mistral' | 'azure' | 'ollama';
export interface ProviderConfig {
    package: string;
    factory: string;
}
/**
 * Security: Explicit allowlist of supported providers and their packages.
 * Dynamic imports are only allowed for these pre-defined packages.
 */
export declare const PROVIDER_CONFIG: Record<SupportedProvider, ProviderConfig>;
/**
 * Ollama-specific configuration
 */
export declare const OLLAMA_CONFIG: {
    /** Default model for Ollama Cloud (qwen3-coder has excellent tool support) */
    readonly defaultModel: "qwen3-coder:480b-cloud";
    /** Ollama Cloud API URL (SDK appends /api paths automatically) */
    readonly cloudHost: "https://ollama.com";
    /** Local Ollama API URL (SDK appends /api paths automatically) */
    readonly localHost: "http://localhost:11434";
    /** Enable reliable object generation with automatic JSON repair (v3.0.0+) */
    readonly reliableObjectGeneration: true;
    /** Object generation options for better reliability */
    readonly objectGenerationOptions: {
        /** Enable automatic JSON repair for malformed outputs */
        readonly enableTextRepair: true;
        /** Maximum retries for object generation */
        readonly maxRetries: 3;
    };
};
/**
 * Check if a provider name is valid
 */
export declare function isValidProvider(name: string): name is SupportedProvider;
/**
 * Get list of supported provider names
 */
export declare function getSupportedProviders(): SupportedProvider[];
/**
 * Load an AI provider dynamically.
 *
 * @param providerName - Name of the provider (anthropic, openai, etc.)
 * @param apiKey - API key for the provider
 * @returns A function that creates a model instance
 * @throws Error if provider is unknown or package not installed
 */
export declare function loadProvider(providerName: string, apiKey: string): Promise<ModelFactory>;
/**
 * Get or create a cached provider instance.
 *
 * @param providerName - Name of the provider
 * @param apiKey - API key for the provider
 * @returns A function that creates a model instance
 */
export declare function getOrLoadProvider(providerName: string, apiKey: string): Promise<ModelFactory>;
/**
 * Clear the provider cache (useful for testing)
 */
export declare function clearProviderCache(): void;
export interface ProviderOptions {
    /** AI provider: anthropic, openai, google, mistral, azure, ollama */
    provider?: string;
    /** Model to use */
    model?: string;
    /** API key (defaults to provider-specific env var) */
    apiKey?: string;
}
/**
 * Resolve provider options with defaults from config.
 *
 * @param options - User-provided options
 * @returns Resolved provider name, model, and API key
 * @throws Error if API key is not available
 */
export declare function resolveProviderOptions(options?: ProviderOptions): {
    providerName: string;
    model: string;
    apiKey: string;
};
//# sourceMappingURL=providers.d.ts.map