/**
 * Type definitions for agentic-crew CLI integration
 *
 * These types match the JSON output from agentic-crew CLI commands.
 */
import { z } from 'zod';
/**
 * Zod schema for CrewToolConfig validation
 */
export const CrewToolConfigSchema = z.object({
    invokeMethod: z.enum(['uv', 'direct']).default('uv'),
    defaultTimeout: z.number().positive().default(300000),
    env: z.record(z.string(), z.string()).optional(),
});
/**
 * Zod schema for InvokeCrewOptions validation
 */
export const InvokeCrewOptionsSchema = z.object({
    package: z
        .string()
        .min(1)
        .regex(/^[a-zA-Z0-9_.-]+$/, 'Package name must be alphanumeric and may include hyphens, underscores, or dots'),
    crew: z
        .string()
        .min(1)
        .regex(/^[a-zA-Z0-9_.-]+$/, 'Crew name must be alphanumeric and may include hyphens, underscores, or dots'),
    input: z.string(),
    timeout: z.number().positive().optional(),
    env: z.record(z.string(), z.string()).optional(),
});
/**
 * Validate CrewToolConfig
 */
export function validateConfig(config) {
    return CrewToolConfigSchema.parse(config);
}
/**
 * Validate InvokeCrewOptions
 */
export function validateInvokeOptions(options) {
    return InvokeCrewOptionsSchema.parse(options);
}
//# sourceMappingURL=types.js.map