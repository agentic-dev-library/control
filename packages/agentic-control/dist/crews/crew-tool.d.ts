/**
 * CrewTool - TypeScript interface for invoking agentic-crew CLI
 *
 * This tool invokes the published agentic-crew Python package via CLI,
 * enabling TypeScript/Node.js applications to run AI crews.
 *
 * Architecture:
 * - agentic-crew (Python): Crew orchestration, framework decomposition
 * - agentic-control (TypeScript): Fleet management, invokes crews via this tool
 */
import type { CrewInfo, CrewResult, CrewToolConfig, InvokeCrewOptions } from './types.js';
/**
 * Error categories for crew tool operations
 */
export type CrewToolErrorCategory = 'config' | 'validation' | 'subprocess' | 'crew' | 'not_installed';
/**
 * Custom error class for crew tool operations
 */
export declare class CrewToolError extends Error {
    category: CrewToolErrorCategory;
    details?: Record<string, unknown> | undefined;
    constructor(message: string, category: CrewToolErrorCategory, details?: Record<string, unknown> | undefined);
}
/**
 * Crew tool for invoking agentic-crew from TypeScript
 *
 * @example Basic usage
 * ```typescript
 * const crewTool = new CrewTool();
 *
 * // List available crews
 * const crews = await crewTool.listCrews();
 *
 * // Run a crew
 * const result = await crewTool.invokeCrew({
 *   package: 'otterfall',
 *   crew: 'game_builder',
 *   input: 'Create a QuestComponent',
 * });
 * ```
 *
 * @example As a Vercel AI tool
 * ```typescript
 * import { tool } from 'ai';
 * import { z } from 'zod';
 *
 * const crewTool = new CrewTool();
 *
 * export const invokeCrewTool = tool({
 *   description: 'Delegate a task to a specialized AI crew',
 *   parameters: z.object({
 *     package: z.string(),
 *     crew: z.string(),
 *     input: z.string(),
 *   }),
 *   execute: async ({ package: pkg, crew, input }) => {
 *     const result = await crewTool.invokeCrew({ package: pkg, crew, input });
 *     if (!result.success) throw new Error(result.error);
 *     return result.output;
 *   },
 * });
 * ```
 */
export declare class CrewTool {
    private config;
    constructor(config?: CrewToolConfig);
    /**
     * List all available crews across all packages
     */
    listCrews(): Promise<CrewInfo[]>;
    /**
     * Get detailed information about a specific crew
     */
    getCrewInfo(packageName: string, crewName: string): Promise<CrewInfo>;
    /**
     * Invoke a crew with the given input
     */
    invokeCrew(options: InvokeCrewOptions): Promise<CrewResult>;
    /**
     * Execute an agentic-crew CLI command
     *
     * Security notes:
     * - Uses spawn() with argument array (no shell interpretation)
     * - Package/crew names are validated via Zod regex: /^[a-zA-Z0-9_.-]+$/
     * - Input strings are passed as single array elements (not shell-interpolated)
     * - No shell=true option is used, preventing command injection
     */
    private executeCommand;
}
//# sourceMappingURL=crew-tool.d.ts.map