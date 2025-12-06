/**
 * Type definitions for crew tool integration
 */

import { z } from 'zod';

/**
 * Configuration for crew tool execution
 */
export interface CrewToolConfig {
  /** Path to Python executable (default: 'uv') */
  pythonExecutable?: string;
  /** Path to crew-agents package (default: auto-detect) */
  crewAgentsPath?: string;
  /** Default timeout in milliseconds (default: 300000 = 5 minutes) */
  defaultTimeout?: number;
  /** Environment variables to pass to crew execution */
  env?: Record<string, string>;
}

/**
 * Options for invoking a crew
 */
export interface InvokeCrewOptions {
  /** Package name (e.g., 'otterfall') */
  package: string;
  /** Crew name (e.g., 'game_builder') */
  crew: string;
  /** Input specification for the crew */
  input: string;
  /** Optional timeout override in milliseconds */
  timeout?: number;
  /** Optional additional environment variables */
  env?: Record<string, string>;
}

/**
 * Result from crew execution
 */
export interface CrewResult {
  /** Whether execution succeeded */
  success: boolean;
  /** Crew output (if successful) */
  output?: string;
  /** Error message (if failed) */
  error?: string;
  /** Exit code from subprocess */
  exitCode?: number;
  /** Execution time in milliseconds */
  duration: number;
}

/**
 * Information about an available crew
 */
export interface CrewInfo {
  /** Package name */
  package: string;
  /** Crew name */
  name: string;
  /** Crew description */
  description: string;
}

/**
 * Zod schema for CrewToolConfig validation
 */
export const CrewToolConfigSchema = z.object({
  pythonExecutable: z.string().default('uv'),
  crewAgentsPath: z.string().optional(),
  defaultTimeout: z.number().positive().default(300000),
  env: z.record(z.string(), z.string()).optional(),
});

/**
 * Zod schema for InvokeCrewOptions validation
 */
export const InvokeCrewOptionsSchema = z.object({
  package: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Package name must be alphanumeric with hyphens or underscores'),
  crew: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Crew name must be alphanumeric with hyphens or underscores'),
  input: z.string(),
  timeout: z.number().positive().optional(),
  env: z.record(z.string(), z.string()).optional(),
});

/**
 * Validate CrewToolConfig
 */
export function validateConfig(config: unknown): CrewToolConfig {
  return CrewToolConfigSchema.parse(config);
}

/**
 * Validate InvokeCrewOptions
 */
export function validateInvokeOptions(options: unknown): InvokeCrewOptions {
  return InvokeCrewOptionsSchema.parse(options);
}
