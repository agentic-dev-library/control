/**
 * Escalation Configuration
 *
 * Defines configuration options for the 7-level escalation ladder.
 * Controls retry attempts, cloud agent behavior, and cost budgets.
 */

/**
 * Configuration for the escalation ladder
 */
export interface EscalationConfig {
    /** Maximum number of Ollama fix attempts before escalating (Default: 2) */
    maxOllamaAttempts: number;

    /** Maximum number of initial Jules attempts before escalating (Default: 3) */
    maxJulesAttempts: number;

    /** Maximum number of Jules attempts with boosted context (Default: 3) */
    maxJulesBoostAttempts: number;

    /** Whether cloud agents (e.g., Cursor) are enabled (Default: false) */
    cloudAgentEnabled: boolean;

    /** Whether cloud agents require explicit approval via label (Default: true) */
    cloudAgentApprovalRequired: boolean;

    /** Daily cost budget for cloud agents in cents (Default: 0 = no cloud) */
    costBudgetDaily: number;
}

/**
 * Default escalation configuration - prioritizes free options
 */
export const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
    maxOllamaAttempts: 2,
    maxJulesAttempts: 3,
    maxJulesBoostAttempts: 3,
    cloudAgentEnabled: false,
    cloudAgentApprovalRequired: true,
    costBudgetDaily: 0,
};

/**
 * Create escalation config with defaults
 */
export function createEscalationConfig(partial?: Partial<EscalationConfig>): EscalationConfig {
    return {
        ...DEFAULT_ESCALATION_CONFIG,
        ...partial,
    };
}
