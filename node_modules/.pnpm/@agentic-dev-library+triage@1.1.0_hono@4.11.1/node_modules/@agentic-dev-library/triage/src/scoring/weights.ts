/**
 * Default weights for complexity scoring dimensions
 * These can be calibrated over time based on outcome data
 */

export interface ComplexityWeights {
    files_changed: number;
    lines_changed: number;
    dependency_depth: number;
    test_coverage_need: number;
    cross_module_impact: number;
    semantic_complexity: number;
    context_required: number;
    risk_level: number;
}

export const DEFAULT_WEIGHTS: ComplexityWeights = {
    files_changed: 0.15,
    lines_changed: 0.1,
    dependency_depth: 0.15,
    test_coverage_need: 0.1,
    cross_module_impact: 0.15,
    semantic_complexity: 0.2,
    context_required: 0.1,
    risk_level: 0.05,
};

/**
 * Tier thresholds for routing decisions
 */
export interface TierThresholds {
    trivial: number; // 0 to this = trivial
    simple: number; // trivial to this = simple
    moderate: number; // simple to this = moderate
    complex: number; // moderate to this = complex
    // above complex = expert
}

export const DEFAULT_THRESHOLDS: TierThresholds = {
    trivial: 2.5,
    simple: 5.0,
    moderate: 7.0,
    complex: 8.5,
};

export type ComplexityTier = 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert';
export type AgentTier = 'ollama' | 'jules' | 'cursor';

/**
 * Map complexity tier to recommended agent
 */
export function tierToAgent(tier: ComplexityTier, cursorEnabled = false): AgentTier {
    switch (tier) {
        case 'trivial':
        case 'simple':
            return 'ollama';
        case 'moderate':
        case 'complex':
            return 'jules';
        case 'expert':
            // Only use cursor if explicitly enabled, otherwise stay with jules
            return cursorEnabled ? 'cursor' : 'jules';
    }
}

/**
 * Determine tier from weighted score
 */
export function scoreToTier(score: number, thresholds = DEFAULT_THRESHOLDS): ComplexityTier {
    if (score <= thresholds.trivial) return 'trivial';
    if (score <= thresholds.simple) return 'simple';
    if (score <= thresholds.moderate) return 'moderate';
    if (score <= thresholds.complex) return 'complex';
    return 'expert';
}

/**
 * Calculate weighted score from raw dimension scores
 */
export function calculateWeightedScore(
    raw: Record<string, number>,
    weights: ComplexityWeights = DEFAULT_WEIGHTS
): number {
    let score = 0;
    for (const [key, weight] of Object.entries(weights)) {
        score += weight * (raw[key] ?? 0);
    }
    return Math.round(score * 100) / 100; // Round to 2 decimal places
}
