/**
 * Escalation Ladder Example
 *
 * This example demonstrates how to use the 7-level escalation ladder
 * to progressively handle tasks from simple static analysis to expensive
 * cloud agents, only when absolutely necessary.
 */

import { EscalationLadder, type LevelHandler, type Task } from '../src/escalation/index.js';

// ============================================================================
// Setup Escalation Ladder
// ============================================================================

const ladder = new EscalationLadder({
    maxOllamaAttempts: 2,
    maxJulesAttempts: 3,
    maxJulesBoostAttempts: 3,
    cloudAgentEnabled: true, // Enable cloud agents
    cloudAgentApprovalRequired: true, // Require explicit approval
    costBudgetDaily: 5000, // $50 daily budget in cents
});

// ============================================================================
// Register Handlers for Each Level
// ============================================================================

// Level 0: Static Analysis (lint/tsc)
const staticAnalysisHandler: LevelHandler = async (task) => {
    console.log('[Level 0] Running static analysis...');

    // Simulate running linters
    const hasLintErrors = task.context.includes('error');

    if (!hasLintErrors) {
        return {
            success: true,
            data: 'No lint errors found',
            escalate: false,
            cost: 0,
        };
    }

    return {
        success: false,
        error: 'Lint errors found, escalating',
        escalate: true,
        cost: 0,
    };
};

// Level 1: Complexity Evaluation (Ollama)
const complexityEvalHandler: LevelHandler = async (task) => {
    console.log('[Level 1] Evaluating complexity with Ollama...');

    // Simulate complexity evaluation
    const isSimple = task.description.toLowerCase().includes('simple');

    if (isSimple) {
        // Route to Ollama fix (level 2)
        return {
            success: false,
            error: 'Simple fix needed, routing to level 2',
            escalate: true,
            cost: 0,
        };
    }

    // Route to Jules (level 3)
    return {
        success: false,
        error: 'Complex task, routing to level 3',
        escalate: true,
        cost: 0,
    };
};

// Level 2: Ollama Fix
const ollamaFixHandler: LevelHandler = async (task) => {
    console.log('[Level 2] Attempting fix with Ollama...');

    // Simulate Ollama fix attempt
    const canFix = Math.random() > 0.5;

    if (canFix) {
        return {
            success: true,
            data: 'Fixed by Ollama',
            escalate: false,
            cost: 0,
        };
    }

    return {
        success: false,
        error: 'Ollama could not fix, escalating',
        escalate: false, // Will retry up to maxOllamaAttempts
        cost: 0,
    };
};

// Level 3: Jules Session
const julesHandler: LevelHandler = async (task) => {
    console.log('[Level 3] Running Jules session...');

    // Simulate Jules attempt
    const canFix = Math.random() > 0.7;

    if (canFix) {
        return {
            success: true,
            data: 'Fixed by Jules',
            escalate: false,
            cost: 0,
        };
    }

    return {
        success: false,
        error: 'Jules could not fix, escalating',
        escalate: false, // Will retry up to maxJulesAttempts
        cost: 0,
    };
};

// Level 4: Jules + Boosted Context
const julesBoostHandler: LevelHandler = async (task) => {
    console.log('[Level 4] Running Jules with boosted context...');

    // Simulate Jules with more context
    const canFix = Math.random() > 0.8;

    if (canFix) {
        return {
            success: true,
            data: 'Fixed by Jules with boost',
            escalate: false,
            cost: 0,
        };
    }

    return {
        success: false,
        error: 'Jules boost could not fix, escalating',
        escalate: false, // Will retry up to maxJulesBoostAttempts
        cost: 0,
    };
};

// Level 5: Human Review Queue
const humanReviewHandler: LevelHandler = async (task) => {
    console.log('[Level 5] Queued for human review...');

    // In a real implementation, this would queue the task
    // and wait for human approval
    return {
        success: false,
        error: 'Awaiting human approval for cloud agent',
        escalate: true,
        cost: 0,
    };
};

// Level 6: Cloud Agent (Cursor)
const cloudAgentHandler: LevelHandler = async (task) => {
    console.log('[Level 6] Using expensive cloud agent...');

    // Simulate cloud agent (expensive)
    const result = {
        success: true,
        data: 'Fixed by cloud agent',
        escalate: false,
        cost: 1000, // $10 in cents
    };

    console.log(`Cloud agent cost: $${result.cost / 100}`);
    return result;
};

// Register all handlers
ladder
    .registerHandler(0, staticAnalysisHandler)
    .registerHandler(1, complexityEvalHandler)
    .registerHandler(2, ollamaFixHandler)
    .registerHandler(3, julesHandler)
    .registerHandler(4, julesBoostHandler)
    .registerHandler(5, humanReviewHandler)
    .registerHandler(6, cloudAgentHandler);

// ============================================================================
// Process Tasks
// ============================================================================

async function main() {
    // Task 1: Simple fix (no approval needed)
    const task1: Task = {
        id: 'task-1',
        description: 'Simple bug fix',
        context: 'const x = 1;',
    };

    console.log('\n=== Processing Task 1 (Simple) ===');
    const result1 = await ladder.process(task1);
    console.log('Result:', {
        success: result1.success,
        level: result1.level,
        cost: result1.cost,
        attempts: result1.attempts,
    });

    // Task 2: Complex fix (requires approval for cloud agent)
    const task2: Task = {
        id: 'task-2',
        description: 'Complex refactoring with error',
        context: 'const x = 1; // error here',
        metadata: {
            labels: ['approved:cloud-agent'], // Pre-approved
        },
    };

    console.log('\n=== Processing Task 2 (Complex, Approved) ===');
    const result2 = await ladder.process(task2);
    console.log('Result:', {
        success: result2.success,
        level: result2.level,
        cost: result2.cost,
        attempts: result2.attempts,
    });

    // Task 3: Without approval (should not reach cloud agent)
    const task3: Task = {
        id: 'task-3',
        description: 'Complex task without approval',
        context: 'const x = 1; // error',
    };

    console.log('\n=== Processing Task 3 (No Approval) ===');
    const result3 = await ladder.process(task3);
    console.log('Result:', {
        success: result3.success,
        level: result3.level,
        cost: result3.cost,
        attempts: result3.attempts,
    });

    // Show cost tracking
    console.log('\n=== Cost Summary ===');
    const costTracker = ladder.getCostTracker();
    const dailyStats = costTracker.getDailyStats();
    console.log('Total cost today:', `$${dailyStats.total / 100}`);
    console.log('Remaining budget:', `$${costTracker.getRemainingBudget() / 100}`);
    console.log('Operations:', dailyStats.operations);

    // Show all task states
    console.log('\n=== Task States ===');
    const states = ladder.getAllStates();
    for (const state of states) {
        console.log(`Task ${state.taskId}:`, {
            level: state.level,
            resolved: state.resolved,
            cost: `$${state.cost / 100}`,
            attempts: state.attempts,
        });
    }
}

main().catch(console.error);
