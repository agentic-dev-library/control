/**
 * Claude runtime adapter for sandbox execution
 */
import type { AgentOutput, RuntimeAdapter, RuntimeOptions } from '../types.js';
export declare class ClaudeRuntime implements RuntimeAdapter {
    readonly name = "claude";
    readonly image = "jbcom/agentic-control:latest";
    prepareCommand(prompt: string, options: RuntimeOptions): string[];
    parseOutput(stdout: string, stderr: string): AgentOutput;
    validateEnvironment(): Promise<boolean>;
}
//# sourceMappingURL=claude.d.ts.map