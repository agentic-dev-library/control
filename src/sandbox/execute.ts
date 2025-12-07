#!/usr/bin/env node
/**
 * Sandbox Execution CLI
 *
 * Executes AI agents in an isolated environment with support for
 * multiple runtimes (Claude, Cursor, Custom).
 */

import type { SandboxOptions } from './types.js';
import { claudeRuntime, cursorRuntime, customRuntime, extractOutput } from './runtime.js';

// Environment configuration
const WORKSPACE = process.env.AGENTIC_WORKSPACE || '/workspace';
const OUTPUT = process.env.AGENTIC_OUTPUT || '/output';
const DEFAULT_RUNTIME = 'claude';
const DEFAULT_TIMEOUT_SECONDS = '300';
const TIMEOUT = parseInt(process.env.AGENTIC_SANDBOX_TIMEOUT || DEFAULT_TIMEOUT_SECONDS, 10) * 1000;

const runtimes = {
    claude: claudeRuntime,
    cursor: cursorRuntime,
    custom: customRuntime,
};

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): SandboxOptions {
    const options: SandboxOptions = {
        runtime: (process.env.AGENTIC_SANDBOX_RUNTIME as 'claude' | 'cursor' | 'custom') || DEFAULT_RUNTIME,
        prompt: '',
        model: undefined,
        script: undefined,
        timeout: TIMEOUT,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--runtime':
            case '-r':
                if (i + 1 >= args.length) {
                    throw new Error('--runtime requires a value');
                }
                options.runtime = args[++i] as 'claude' | 'cursor' | 'custom';
                break;
            case '--prompt':
            case '-p':
                if (i + 1 >= args.length) {
                    throw new Error('--prompt requires a value');
                }
                options.prompt = args[++i];
                break;
            case '--model':
            case '-m':
                if (i + 1 >= args.length) {
                    throw new Error('--model requires a value');
                }
                options.model = args[++i];
                break;
            case '--script':
                if (i + 1 >= args.length) {
                    throw new Error('--script requires a value');
                }
                options.script = args[++i];
                break;
            case '--timeout':
            case '-t':
                if (i + 1 >= args.length) {
                    throw new Error('--timeout requires a value');
                }
                const timeoutValue = parseInt(args[++i], 10);
                if (isNaN(timeoutValue) || timeoutValue <= 0) {
                    throw new Error('--timeout must be a positive number');
                }
                options.timeout = timeoutValue * 1000;
                break;
            default:
                if (!arg.startsWith('-') && !options.prompt) {
                    options.prompt = arg;
                }
        }
    }

    return options;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const options = parseArgs(args);

    if (!options.prompt) {
        console.error('❌ Error: No prompt provided');
        console.error('Usage: sandbox run --prompt "Your task" [--runtime claude|cursor|custom]');
        process.exit(1);
    }

    const runtime = runtimes[options.runtime || 'claude'];
    if (!runtime) {
        console.error(`❌ Error: Unknown runtime "${options.runtime}"`);
        console.error('Available runtimes: claude, cursor, custom');
        process.exit(1);
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           agentic-control sandbox execution                ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Runtime:   ${(options.runtime || 'claude').padEnd(47)}║`);
    console.log(`║ Workspace: ${WORKSPACE.padEnd(47)}║`);
    console.log(`║ Output:    ${OUTPUT.padEnd(47)}║`);
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📝 Prompt:');
    console.log(options.prompt);
    console.log('');
    console.log('─'.repeat(60));
    console.log('');

    try {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Execution timeout')), options.timeout);
        });

        const result = await Promise.race([
            runtime(options.prompt, options),
            timeoutPromise,
        ]);

        await extractOutput();

        console.log('');

        // Check if runtime reported failure
        if (!result.success) {
            console.error(`❌ Sandbox execution failed: ${result.error || 'Unknown error'}`);
            process.exit(1);
        }

        console.log('🎉 Sandbox execution complete!');
    } catch (error) {
        console.error('');
        console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
