/**
 * Runtime executors for different AI agent backends
 */

import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import type { RuntimeExecutor, RuntimeOptions, RuntimeResult } from './types.js';

// Environment configuration
const WORKSPACE = process.env.AGENTIC_WORKSPACE || '/workspace';
const OUTPUT = process.env.AGENTIC_OUTPUT || '/output';

/**
 * Claude runtime using @anthropic-ai/claude-agent-sdk
 */
export const claudeRuntime: RuntimeExecutor = async (
    prompt: string,
    _options: RuntimeOptions = {}
): Promise<RuntimeResult> => {
    // Validate API key is present
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required for Claude runtime');
    }

    // Import the Claude Agent SDK
    const { query } = await import('@anthropic-ai/claude-agent-sdk');

    console.log('🤖 Starting Claude agent...');
    console.log(`📁 Workspace: ${WORKSPACE}`);
    console.log(`📤 Output: ${OUTPUT}`);
    console.log('');

    const startTime = Date.now();

    try {
        // Use the SDK's query function with workspace directory
        const generator = query({
            prompt,
            options: {
                cwd: WORKSPACE,
            },
        });

        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        for await (const message of generator) {
            if (message.type === 'assistant') {
                // Display assistant responses - message is an APIAssistantMessage
                for (const block of message.message.content) {
                    if (block.type === 'text') {
                        process.stdout.write(block.text);
                    } else if (block.type === 'tool_use') {
                        console.log(`\n🔧 Tool: ${block.name}`);
                    }
                }
            } else if (message.type === 'result') {
                // Collect token usage
                if (message.usage) {
                    totalInputTokens = message.usage.inputTokens || 0;
                    totalOutputTokens = message.usage.outputTokens || 0;
                }
            }
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log('\n');
        console.log('─'.repeat(50));
        console.log(`✅ Completed in ${elapsed}s`);
        console.log(
            `📊 Tokens: ${totalInputTokens + totalOutputTokens} (in: ${totalInputTokens}, out: ${totalOutputTokens})`
        );

        return {
            success: true,
            elapsed: parseFloat(elapsed),
        };
    } catch (error) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            elapsed: parseFloat(elapsed),
        };
    }
};

/**
 * Cursor runtime using Cursor Background Agent API
 */
export const cursorRuntime: RuntimeExecutor = async (
    prompt: string,
    _options: RuntimeOptions = {}
): Promise<RuntimeResult> => {
    // Validate API key is present
    if (!process.env.CURSOR_API_KEY) {
        throw new Error('CURSOR_API_KEY environment variable is required for Cursor runtime');
    }

    const { Fleet } = await import('../fleet/index.js');
    
    const fleet = new Fleet();
    
    console.log('🖱️ Starting Cursor background agent...');
    console.log(`📁 Workspace: ${WORKSPACE}`);
    console.log(`📤 Output: ${OUTPUT}`);
    console.log('');

    const startTime = Date.now();

    // Spawn agent - note: repository must be provided via environment or will fail
    const repository = process.env.AGENTIC_SANDBOX_REPOSITORY;
    if (!repository) {
        throw new Error('AGENTIC_SANDBOX_REPOSITORY environment variable is required for Cursor runtime');
    }

    const result = await fleet.spawn({
        repository,
        task: prompt,
        ref: process.env.AGENTIC_SANDBOX_REF || 'main',
    });

    if (!result.success || !result.data) {
        return {
            success: false,
            error: result.error || 'Failed to spawn Cursor agent',
        };
    }

    const agentId = result.data.id;
    console.log(`Agent spawned: ${agentId}`);
    console.log('Waiting for completion...');

    // Wait for agent to complete
    const waitResult = await fleet.waitFor(agentId, {
        timeout: 600000, // 10 minutes
        pollInterval: 10000,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!waitResult.success || !waitResult.data) {
        return {
            success: false,
            error: waitResult.error || 'Agent execution failed',
            elapsed: parseFloat(elapsed),
        };
    }

    const agent = waitResult.data;
    
    console.log('\n');
    console.log('─'.repeat(50));
    console.log(`✅ Completed in ${elapsed}s`);
    console.log(`Status: ${agent.status}`);
    if (agent.target?.prUrl) {
        console.log(`PR: ${agent.target.prUrl}`);
    }

    return {
        success: agent.status === 'COMPLETED' || agent.status === 'FINISHED',
        error: agent.status === 'FAILED' ? agent.error : undefined,
        elapsed: parseFloat(elapsed),
    };
};

/**
 * Custom script runtime
 */
export const customRuntime: RuntimeExecutor = async (
    prompt: string,
    options: RuntimeOptions = {}
): Promise<RuntimeResult> => {
    const script = options.script || process.env.AGENTIC_CUSTOM_SCRIPT;

    if (!script) {
        throw new Error('Custom runtime requires --script or AGENTIC_CUSTOM_SCRIPT');
    }

    // Validate script path to prevent command injection
    // Only allow paths without shell metacharacters
    if (
        script.includes('|') ||
        script.includes('&') ||
        script.includes(';') ||
        script.includes('`') ||
        script.includes('$')
    ) {
        throw new Error('Invalid script path: shell metacharacters not allowed');
    }

    console.log(`🔧 Running custom script: ${script}`);

    return new Promise((resolve, reject) => {
        const proc = spawn(script, [prompt], {
            cwd: WORKSPACE,
            env: { ...process.env },
            stdio: 'inherit',
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true });
            } else {
                reject(new Error(`Script exited with code ${code}`));
            }
        });

        proc.on('error', (err) => {
            reject(new Error(`Failed to execute script: ${err.message}`));
        });
    });
};

/**
 * Copy generated files to output directory
 */
export async function extractOutput(): Promise<void> {
    try {
        // Recursively copy contents of workspace to output
        await fs.cp(WORKSPACE, OUTPUT, { recursive: true });

        const entries = await fs.readdir(OUTPUT);
        if (entries.length > 0) {
            console.log(`\n📦 Extracted ${entries.length} files/directories to ${OUTPUT}`);
        }
    } catch (error) {
        // Ignore ENOENT errors which occur if the workspace directory doesn't exist
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.warn(
                `⚠️ Could not extract output: ${error instanceof Error ? error.message : error}`
            );
        }
    }
}
