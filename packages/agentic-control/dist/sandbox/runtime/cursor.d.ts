/**
 * Cursor runtime adapter for sandbox execution
 */
import type { AgentOutput, RuntimeAdapter, RuntimeOptions } from '../types.js';
export declare class CursorRuntime implements RuntimeAdapter {
    readonly name = "cursor";
    readonly image = "jbcom/agentic-control:latest";
    prepareCommand(prompt: string, options: RuntimeOptions): string[];
    parseOutput(stdout: string, stderr: string): AgentOutput;
    validateEnvironment(): Promise<boolean>;
}
//# sourceMappingURL=cursor.d.ts.map