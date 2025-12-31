/**
 * @agentic-dev-library/triage - Scoring Module
 *
 * Sigma-weighted complexity evaluation for intelligent task routing.
 *
 * Key exports:
 * - Weights: Configurable dimension weights and tier thresholds
 * - Evaluator: LLM-agnostic complexity evaluation
 * - Agents: Provider-agnostic agent interfaces and registry
 * - Router: Intelligent task routing with escalation
 */

// Agent interfaces and registry
export {
    type AgentCapabilities,
    type AgentConfig,
    type AgentDefinition,
    type AgentExecutor,
    type AgentFactory,
    AgentRegistry,
    type AgentResult,
    type AgentTask,
} from './agents.js';

// Complexity evaluation
export {
    type ComplexityScore,
    calculateComplexity,
    type DimensionScores,
    type EvaluatorConfig,
    estimateComplexityHeuristic,
    evaluateComplexity,
    generateEvaluationPrompt,
    type LLMEvaluator,
    parseEvaluationResponse,
} from './evaluator.js';
// Task router
export {
    createRouter,
    type RouterConfig,
    type RouterState,
    type RoutingResult,
    TaskRouter,
} from './router.js';
// Weights and thresholds
export {
    type ComplexityTier,
    type ComplexityWeights,
    calculateWeightedScore,
    DEFAULT_THRESHOLDS,
    DEFAULT_WEIGHTS,
    scoreToTier,
    type TierThresholds,
    tierToAgent,
} from './weights.js';
