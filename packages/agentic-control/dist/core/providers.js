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
import { getDefaultApiKeyEnvVar, getTriageConfig } from './config.js';
// ============================================
// Provider Configuration
// ============================================
/**
 * Security: Explicit allowlist of supported providers and their packages.
 * Dynamic imports are only allowed for these pre-defined packages.
 */
export const PROVIDER_CONFIG = {
    anthropic: { package: '@ai-sdk/anthropic', factory: 'createAnthropic' },
    openai: { package: '@ai-sdk/openai', factory: 'createOpenAI' },
    google: { package: '@ai-sdk/google', factory: 'createGoogleGenerativeAI' },
    mistral: { package: '@ai-sdk/mistral', factory: 'createMistral' },
    azure: { package: '@ai-sdk/azure', factory: 'createAzure' },
    ollama: { package: 'ai-sdk-ollama', factory: 'createOllama' },
};
/**
 * Ollama-specific configuration
 */
export const OLLAMA_CONFIG = {
    /** Default model for Ollama Cloud (qwen3-coder has excellent tool support) */
    defaultModel: 'qwen3-coder:480b-cloud',
    /** Ollama Cloud API URL (SDK appends /api paths automatically) */
    cloudHost: 'https://ollama.com',
    /** Local Ollama API URL (SDK appends /api paths automatically) */
    localHost: 'http://localhost:11434',
    /** Enable reliable object generation with automatic JSON repair (v3.0.0+) */
    reliableObjectGeneration: true,
    /** Object generation options for better reliability */
    objectGenerationOptions: {
        /** Enable automatic JSON repair for malformed outputs */
        enableTextRepair: true,
        /** Maximum retries for object generation */
        maxRetries: 3,
    },
};
/**
 * Check if a provider name is valid
 */
export function isValidProvider(name) {
    return name in PROVIDER_CONFIG;
}
/**
 * Get list of supported provider names
 */
export function getSupportedProviders() {
    return Object.keys(PROVIDER_CONFIG);
}
// ============================================
// Provider Loading
// ============================================
/**
 * Load an AI provider dynamically.
 *
 * @param providerName - Name of the provider (anthropic, openai, etc.)
 * @param apiKey - API key for the provider
 * @returns A function that creates a model instance
 * @throws Error if provider is unknown or package not installed
 */
export async function loadProvider(providerName, apiKey) {
    // Security: Validate provider name against explicit allowlist
    if (!isValidProvider(providerName)) {
        throw new Error(`Unknown provider: ${providerName}\n` +
            `Supported providers: ${getSupportedProviders().join(', ')}`);
    }
    const config = PROVIDER_CONFIG[providerName];
    try {
        // Security: Only import from pre-defined allowlist - no user input in import path
        let module;
        switch (providerName) {
            case 'anthropic':
                module = await import('@ai-sdk/anthropic');
                break;
            case 'openai':
                module = await import('@ai-sdk/openai');
                break;
            case 'google':
                module = await import('@ai-sdk/google');
                break;
            case 'mistral':
                module = await import('@ai-sdk/mistral');
                break;
            case 'azure':
                module = await import('@ai-sdk/azure');
                break;
            case 'ollama':
                module = await import('ai-sdk-ollama');
                break;
            default:
                // This should never happen due to isValidProvider check above
                throw new Error(`Provider ${providerName} not implemented`);
        }
        const factory = module[config.factory];
        if (typeof factory !== 'function') {
            throw new Error(`Factory ${config.factory} not found in ${config.package}`);
        }
        // Ollama provider has different config structure (ai-sdk-ollama v3.0.0+)
        if (providerName === 'ollama') {
            // Determine host URL based on API key presence
            const host = process.env.OLLAMA_HOST || (apiKey ? OLLAMA_CONFIG.cloudHost : OLLAMA_CONFIG.localHost);
            // Normalize URL to remove any trailing slashes or /api path (SDK appends /api automatically)
            const normalizedHost = host.replace(/\/api\/?$/, '').replace(/\/$/, '');
            const provider = factory({
                baseURL: normalizedHost,
                headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
            });
            // Return a model factory that applies reliability settings by default
            return (model) => provider(model, {
                // Enable reliable object generation with automatic JSON repair
                reliableObjectGeneration: OLLAMA_CONFIG.reliableObjectGeneration,
                objectGenerationOptions: OLLAMA_CONFIG.objectGenerationOptions,
            });
        }
        const provider = factory({ apiKey });
        return (model) => provider(model);
    }
    catch (err) {
        if (err.code === 'ERR_MODULE_NOT_FOUND') {
            throw new Error(`Provider package not installed: ${config.package}\n` +
                `Install it with: pnpm add ${config.package}`);
        }
        throw err;
    }
}
// ============================================
// Provider Instance Management
// ============================================
/**
 * Cached provider instances to avoid re-loading
 */
const providerCache = new Map();
/**
 * Get or create a cached provider instance.
 *
 * @param providerName - Name of the provider
 * @param apiKey - API key for the provider
 * @returns A function that creates a model instance
 */
export async function getOrLoadProvider(providerName, apiKey) {
    const cacheKey = `${providerName}:${apiKey.slice(0, 8)}`;
    let provider = providerCache.get(cacheKey);
    if (!provider) {
        provider = await loadProvider(providerName, apiKey);
        providerCache.set(cacheKey, provider);
    }
    return provider;
}
/**
 * Clear the provider cache (useful for testing)
 */
export function clearProviderCache() {
    providerCache.clear();
}
/**
 * Resolve provider options with defaults from config.
 *
 * @param options - User-provided options
 * @returns Resolved provider name, model, and API key
 * @throws Error if API key is not available
 */
export function resolveProviderOptions(options = {}) {
    const triageConfig = getTriageConfig();
    const providerName = options.provider ?? triageConfig.provider ?? 'anthropic';
    const model = options.model ?? triageConfig.model ?? 'claude-sonnet-4-20250514';
    // Determine the correct API key
    const effectiveProvider = options.provider ?? triageConfig.provider ?? 'anthropic';
    const envVarName = options.provider && options.provider !== triageConfig.provider
        ? getDefaultApiKeyEnvVar(effectiveProvider)
        : (triageConfig.apiKeyEnvVar ?? getDefaultApiKeyEnvVar(effectiveProvider));
    const apiKey = options.apiKey ?? process.env[envVarName] ?? '';
    if (!apiKey) {
        const hint = getDefaultApiKeyEnvVar(effectiveProvider);
        throw new Error(`API key required for ${providerName} provider.\n` +
            `Set ${hint} environment variable or pass apiKey option.`);
    }
    return { providerName, model, apiKey };
}
//# sourceMappingURL=providers.js.map