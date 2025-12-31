import { describe, expect, it } from 'vitest';
import { createEscalationConfig, DEFAULT_ESCALATION_CONFIG, type EscalationConfig } from '../src/escalation/config.js';

describe('Escalation Configuration', () => {
    it('should have correct defaults', () => {
        expect(DEFAULT_ESCALATION_CONFIG).toEqual({
            maxOllamaAttempts: 2,
            maxJulesAttempts: 3,
            maxJulesBoostAttempts: 3,
            cloudAgentEnabled: false,
            cloudAgentApprovalRequired: true,
            costBudgetDaily: 0,
        });
    });

    it('should create config with defaults', () => {
        const config = createEscalationConfig();
        expect(config.maxOllamaAttempts).toBe(2);
        expect(config.maxJulesAttempts).toBe(3);
        expect(config.maxJulesBoostAttempts).toBe(3);
        expect(config.cloudAgentEnabled).toBe(false);
        expect(config.cloudAgentApprovalRequired).toBe(true);
        expect(config.costBudgetDaily).toBe(0);
    });

    it('should merge partial config with defaults', () => {
        const config = createEscalationConfig({
            cloudAgentEnabled: true,
            costBudgetDaily: 5000,
        });
        expect(config.cloudAgentEnabled).toBe(true);
        expect(config.costBudgetDaily).toBe(5000);
        expect(config.maxOllamaAttempts).toBe(2); // default preserved
    });

    it('should allow all fields to be overridden', () => {
        const custom: EscalationConfig = {
            maxOllamaAttempts: 5,
            maxJulesAttempts: 10,
            maxJulesBoostAttempts: 8,
            cloudAgentEnabled: true,
            cloudAgentApprovalRequired: false,
            costBudgetDaily: 10000,
        };
        const config = createEscalationConfig(custom);
        expect(config).toEqual(custom);
    });
});
