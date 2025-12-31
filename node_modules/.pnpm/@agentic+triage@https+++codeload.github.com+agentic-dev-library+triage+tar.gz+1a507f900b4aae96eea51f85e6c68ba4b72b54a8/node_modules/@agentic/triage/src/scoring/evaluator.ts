/**
 * Sigma-Weighted Complexity Evaluator
 *
 * This module provides the core complexity scoring algorithm.
 * The actual LLM call is abstracted - users provide an evaluator function.
 *
 * The sigma-weighted system allows AI to assess task complexity
 * across multiple dimensions, producing a weighted score that
 * determines optimal agent routing.
 */

import {
    type ComplexityTier,
    type ComplexityWeights,
    calculateWeightedScore,
    DEFAULT_THRESHOLDS,
    DEFAULT_WEIGHTS,
    scoreToTier,
    type TierThresholds,
} from './weights.js';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Raw dimension scores from evaluation (0-10 each)
 */
export interface DimensionScores {
    files_changed: number;
    lines_changed: number;
    dependency_depth: number;
    test_coverage_need: number;
    cross_module_impact: number;
    semantic_complexity: number;
    context_required: number;
    risk_level: number;
    [key: string]: number; // Allow custom dimensions
}

/**
 * Complete complexity score result
 */
export interface ComplexityScore {
    /** Raw scores for each dimension (0-10) */
    raw: DimensionScores;
    /** Weighted composite score (0-10) */
    weighted: number;
    /** Complexity tier based on thresholds */
    tier: ComplexityTier;
    /** AI's reasoning for the scores */
    reasoning: string;
}

/**
 * Function that performs the actual LLM evaluation
 * Implement this for your LLM provider (Ollama, OpenAI, etc.)
 */
export type LLMEvaluator = (prompt: string) => Promise<string>;

/**
 * Configuration for complexity evaluation
 */
export interface EvaluatorConfig {
    /** Custom weights (defaults to DEFAULT_WEIGHTS) */
    weights?: ComplexityWeights;
    /** Custom tier thresholds (defaults to DEFAULT_THRESHOLDS) */
    thresholds?: TierThresholds;
    /** Maximum context length to send to LLM */
    maxContextLength?: number;
}

// ============================================================================
// The Evaluation Prompt - The Heart of Sigma Scoring
// ============================================================================

/**
 * Generate the evaluation prompt for an LLM
 * This prompt is provider-agnostic - works with any LLM
 */
export function generateEvaluationPrompt(task: string, context: string, maxContext = 8000): string {
    return `You are a code complexity evaluator. Analyze this task and score each dimension 0-10.

TASK:
${task}

CONTEXT:
${context.slice(0, maxContext)}

Score each dimension (0=trivial, 10=extremely complex):

1. files_changed: How many files are affected?
   0=1 file, 3=2-5 files, 6=5-10 files, 10=10+ files

2. lines_changed: Volume of changes?
   0=<10 lines, 3=10-50, 6=50-200, 10=200+

3. dependency_depth: How deep are the import chains?
   0=no deps, 3=local deps, 6=cross-module, 10=cross-repo

4. test_coverage_need: How much testing is required?
   0=none, 3=unit tests, 6=integration tests, 10=e2e + manual

5. cross_module_impact: Does this affect other parts of the system?
   0=isolated, 3=same module, 6=multiple modules, 10=system-wide

6. semantic_complexity: How complex is the logic?
   0=formatting, 3=simple fix, 6=new feature, 10=algorithm design

7. context_required: How much codebase knowledge is needed?
   0=none, 3=file context, 6=module context, 10=full architecture

8. risk_level: Could this break things?
   0=no risk, 3=minor, 6=moderate, 10=critical path

Respond ONLY with valid JSON (no markdown, no explanation outside JSON):
{
  "files_changed": <0-10>,
  "lines_changed": <0-10>,
  "dependency_depth": <0-10>,
  "test_coverage_need": <0-10>,
  "cross_module_impact": <0-10>,
  "semantic_complexity": <0-10>,
  "context_required": <0-10>,
  "risk_level": <0-10>,
  "reasoning": "<one sentence explanation>"
}`;
}

// ============================================================================
// Core Evaluation Functions
// ============================================================================

/**
 * Parse and validate LLM response into dimension scores
 */
export function parseEvaluationResponse(
    response: string,
    weights: ComplexityWeights = DEFAULT_WEIGHTS
): { scores: DimensionScores; reasoning: string } {
    // Try to extract JSON from response (handle markdown code blocks)
    let json = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        json = jsonMatch[1];
    }

    const parsed = JSON.parse(json.trim());

    // Validate and clamp scores to 0-10
    const scores: DimensionScores = {
        files_changed: 0,
        lines_changed: 0,
        dependency_depth: 0,
        test_coverage_need: 0,
        cross_module_impact: 0,
        semantic_complexity: 0,
        context_required: 0,
        risk_level: 0,
    };

    for (const key of Object.keys(weights)) {
        const val = Number(parsed[key]) || 0;
        scores[key] = Math.max(0, Math.min(10, val));
    }

    return {
        scores,
        reasoning: parsed.reasoning || 'No reasoning provided',
    };
}

/**
 * Calculate complexity score from parsed dimension scores
 */
export function calculateComplexity(
    scores: DimensionScores,
    config: EvaluatorConfig = {}
): Omit<ComplexityScore, 'reasoning'> {
    const { weights = DEFAULT_WEIGHTS, thresholds = DEFAULT_THRESHOLDS } = config;

    const weighted = calculateWeightedScore(scores, weights);
    const tier = scoreToTier(weighted, thresholds);

    return {
        raw: scores,
        weighted,
        tier,
    };
}

/**
 * Full evaluation using an LLM
 *
 * @example
 * ```typescript
 * // With Ollama
 * const evaluate = async (prompt: string) => {
 *   const res = await fetch('http://localhost:11434/api/generate', {
 *     method: 'POST',
 *     body: JSON.stringify({ model: 'qwen2.5-coder', prompt, stream: false })
 *   });
 *   return (await res.json()).response;
 * };
 *
 * const score = await evaluateComplexity(evaluate, 'Fix the bug', codeDiff);
 * console.log(score.tier); // 'simple'
 * console.log(score.weighted); // 3.5
 * ```
 */
export async function evaluateComplexity(
    llm: LLMEvaluator,
    task: string,
    context: string,
    config: EvaluatorConfig = {}
): Promise<ComplexityScore> {
    const prompt = generateEvaluationPrompt(task, context, config.maxContextLength);
    const response = await llm(prompt);
    const { scores, reasoning } = parseEvaluationResponse(response, config.weights);
    const result = calculateComplexity(scores, config);

    return {
        ...result,
        reasoning,
    };
}

// ============================================================================
// Heuristic Fallback (No LLM Required)
// ============================================================================

/**
 * Quick complexity estimation without AI (heuristic-based)
 * Useful when LLM is unavailable or for fast pre-filtering
 */
export function estimateComplexityHeuristic(
    options: {
        filesChanged?: number;
        linesChanged?: number;
        hasTests?: boolean;
        isRefactor?: boolean;
        hasDependencyChanges?: boolean;
        isCriticalPath?: boolean;
    },
    config: EvaluatorConfig = {}
): ComplexityScore {
    const {
        filesChanged = 1,
        linesChanged = 10,
        hasTests = true,
        isRefactor = false,
        hasDependencyChanges = false,
        isCriticalPath = false,
    } = options;

    const scores: DimensionScores = {
        files_changed: Math.min(10, filesChanged),
        lines_changed: Math.min(10, Math.log10(linesChanged + 1) * 3),
        dependency_depth: hasDependencyChanges ? 6 : isRefactor ? 4 : 2,
        test_coverage_need: hasTests ? 3 : 6,
        cross_module_impact: filesChanged > 5 ? 7 : filesChanged > 2 ? 4 : 1,
        semantic_complexity: isRefactor ? 6 : 3,
        context_required: filesChanged > 3 ? 6 : 3,
        risk_level: isCriticalPath ? 8 : isRefactor ? 5 : 2,
    };

    const result = calculateComplexity(scores, config);

    return {
        ...result,
        reasoning: 'Heuristic estimation (no LLM evaluation)',
    };
}
