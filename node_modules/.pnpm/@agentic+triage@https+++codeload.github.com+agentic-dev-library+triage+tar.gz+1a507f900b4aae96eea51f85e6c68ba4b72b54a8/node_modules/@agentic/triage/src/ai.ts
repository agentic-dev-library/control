import { createOllama, ollama } from 'ai-sdk-ollama';

// Use a looser type for tools to avoid version incompatibilities between
// @ai-sdk/mcp and the ai package
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolSet = Record<string, any>;

// Default model - qwen3-coder:480b on Ollama Cloud has excellent tool support
export const DEFAULT_MODEL = 'qwen3-coder:480b';
export const CLOUD_HOST = 'https://ollama.com/api';
export const LOCAL_HOST = 'http://localhost:11434/api';

export interface AIConfig {
    /** AI provider name */
    provider?: string;
    apiKey?: string;
    model?: string;
    host?: string;
}

/**
 * Get or create a custom Ollama provider instance
 */
export function getProvider(config: AIConfig = {}) {
    const apiKey = config.apiKey || process.env.OLLAMA_API_KEY;
    const hostEnv = config.host || process.env.OLLAMA_HOST;

    // If no custom config needed, use default provider
    if (!apiKey && !hostEnv) {
        return ollama;
    }

    // Normalize host URL
    let host = hostEnv || (apiKey ? CLOUD_HOST : LOCAL_HOST);
    if (host && !host.endsWith('/api')) {
        host = `${host.replace(/\/$/, '')}/api`;
    }

    // Removed caching to ensure configuration changes are respected
    return createOllama({
        baseURL: host,
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    });
}

/**
 * Get the model ID to use
 */
export function getModel(config: AIConfig = {}): string {
    return config.model || process.env.OLLAMA_MODEL || DEFAULT_MODEL;
}

/**
 * Resolve the Vercel AI SDK model instance to use.
 */
export async function resolveModel(config: AIConfig = {}): Promise<{
    providerName: string;
    modelId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: any;
}> {
    const providerName = config.provider || process.env.TRIAGE_PROVIDER || 'ollama';

    if (providerName === 'ollama') {
        const provider = getProvider(config);
        const modelId = getModel(config);
        return { providerName, modelId, model: provider(modelId) };
    }

    throw new Error(`Provider ${providerName} not supported in standalone mode`);
}
