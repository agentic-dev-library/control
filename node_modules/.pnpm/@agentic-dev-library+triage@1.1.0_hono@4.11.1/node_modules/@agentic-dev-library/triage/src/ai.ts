/**
 * AI Client using Vercel AI SDK
 */

import { generateText, stepCountIs, tool } from 'ai';
import { createOllama, ollama } from 'ai-sdk-ollama';
import type { z } from 'zod';

// Use a looser type for tools to avoid version incompatibilities between
// @ai-sdk/mcp and the ai package
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolSet = Record<string, any>;

// Default model - qwen3-coder:480b on Ollama Cloud has excellent tool support
export const DEFAULT_MODEL = 'qwen3-coder:480b';
export const CLOUD_HOST = 'https://ollama.com/api';
export const LOCAL_HOST = 'http://localhost:11434/api';

export interface AIConfig {
    provider?: string;
    apiKey?: string;
    model?: string;
    host?: string;
}

/**
 * Get or create a Ollama provider instance
 * Uses the default `ollama` export for local, or createOllama for cloud
 */
export function getProvider(config: AIConfig = {}) {
    const apiKey = config.apiKey || process.env.OLLAMA_API_KEY;
    const hostEnv = config.host || process.env.OLLAMA_HOST;

    // If no custom config needed, use default provider
    if (!apiKey && !hostEnv) {
        return ollama;
    }

    // Normalize host URL - ensure it ends with /api for Ollama endpoints
    let host = hostEnv || (apiKey ? CLOUD_HOST : LOCAL_HOST);
    if (host && !host.endsWith('/api')) {
        host = `${host.replace(/\/$/, '')}/api`;
    }

    // Create custom provider with auth headers for cloud
    // Note: We don't cache this globally to avoid issues with different configurations
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

    // Ollama remains the default and supports local mode without a key.
    if (providerName === 'ollama') {
        const provider = getProvider(config);
        const modelId = getModel(config);
        return { providerName, modelId, model: provider(modelId) };
    }

    throw new Error(
        `Provider ${providerName} is not supported in this version. Only 'ollama' provider is currently supported. ` +
            `For other providers, please use the direct AI SDK integration or configure via environment variables.`
    );
}

export interface GenerateOptions extends AIConfig {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
}

/**
 * Generate text using the AI model (no tools)
 */
export async function generate(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const resolved = await resolveModel(options);

    const result = await generateText({
        model: resolved.model,
        system: options.systemPrompt,
        prompt,
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
    });

    return result.text;
}

export interface GenerateWithToolsOptions extends GenerateOptions {
    maxSteps?: number;
    onStepFinish?: (step: { toolCalls?: unknown[]; toolResults?: unknown[]; text?: string }) => void;
}

export interface GenerateWithToolsResult {
    text: string;
    toolCalls: unknown[];
    toolResults: unknown[];
    steps: unknown[];
    finishReason: string;
}

/**
 * Generate text with tools - uses AI SDK's built-in multi-step support
 */
export async function generateWithTools(
    prompt: string,
    tools: ToolSet,
    options: GenerateWithToolsOptions = {}
): Promise<GenerateWithToolsResult> {
    const resolved = await resolveModel(options);
    const maxSteps = options.maxSteps ?? 10;

    const result = await generateText({
        model: resolved.model,
        system: options.systemPrompt,
        prompt,
        tools,
        stopWhen: stepCountIs(maxSteps),
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
        onStepFinish: options.onStepFinish
            ? (step) => {
                  options.onStepFinish?.({
                      toolCalls: step.toolCalls,
                      toolResults: step.toolResults,
                      text: step.text,
                  });
              }
            : undefined,
    });

    // Collect all tool calls and results from all steps
    const allToolCalls: unknown[] = [];
    const allToolResults: unknown[] = [];

    if (result.steps) {
        for (const step of result.steps) {
            if (step.toolCalls) {
                allToolCalls.push(...step.toolCalls);
            }
            if (step.toolResults) {
                allToolResults.push(...step.toolResults);
            }
        }
    }

    return {
        text: result.text,
        toolCalls: allToolCalls,
        toolResults: allToolResults,
        steps: result.steps || [],
        finishReason: result.finishReason,
    };
}

/**
 * Create a simple tool definition helper
 * Wraps the AI SDK's tool() function for convenience
 */
export function createTool<T extends z.ZodType>(config: {
    description: string;
    inputSchema: T;
    execute: (input: z.infer<T>) => Promise<unknown>;
}) {
    return tool({
        description: config.description,
        inputSchema: config.inputSchema,
        execute: config.execute,
    });
}

// Re-export useful types and functions from ai package
export { stepCountIs, tool } from 'ai';
export { z } from 'zod';
