/**
 * Ollama Provider Implementation
 *
 * Creates agents that use Ollama for LLM inference.
 * Ollama is free/self-hosted, ideal for trivial/simple tasks.
 */
import type { AgentCapabilities, AgentDefinition, LLMEvaluator } from '@agentic/triage';
export interface OllamaConfig {
    /** Ollama API URL (default: http://localhost:11434) */
    url?: string;
    /** Model to use (default: qwen2.5-coder:32b) */
    model?: string;
    /** Request timeout in ms (default: 60000) */
    timeout?: number;
}
/**
 * Create an LLM evaluator function for Ollama
 * Use this with @agentic/triage's evaluateComplexity()
 */
export declare function createOllamaEvaluator(config?: OllamaConfig): LLMEvaluator;
/**
 * Create an Ollama-based agent for the registry
 */
export declare function createOllamaAgent(id: string, config?: OllamaConfig, options?: {
    name?: string;
    cost?: number;
    priority?: number;
    capabilities?: Partial<AgentCapabilities>;
}): AgentDefinition<string>;
//# sourceMappingURL=ollama.d.ts.map