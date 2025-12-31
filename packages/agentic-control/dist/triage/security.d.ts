/**
 * Security utilities for the Agent
 *
 * Centralized security functions to prevent:
 * - Path traversal attacks
 * - Command injection
 * - Sandbox escapes
 */
/**
 * Result of path validation
 */
export interface PathValidationResult {
    /** Whether the path is valid and within the sandbox */
    valid: boolean;
    /** The fully resolved path */
    resolvedPath: string;
    /** Error message if validation failed */
    error?: string;
}
/**
 * Validate that a path is within the allowed working directory.
 * Prevents path traversal attacks (e.g., ../../../etc/passwd)
 *
 * @param inputPath - The path to validate (relative or absolute)
 * @param workingDirectory - The sandbox directory that paths must stay within
 * @returns Validation result with resolved path or error
 */
export declare function validatePath(inputPath: string, workingDirectory: string): PathValidationResult;
/**
 * Sanitize a filename for use in shell commands.
 * Prevents command injection via filenames.
 *
 * @param filename - The filename to sanitize
 * @returns Sanitized filename with dangerous characters replaced
 */
export declare function sanitizeFilename(filename: string): string;
/**
 * Check if a shell command contains potentially dangerous patterns.
 * This is a heuristic check - not a replacement for proper sandboxing.
 *
 * @param command - The command to check
 * @returns Object with safety assessment
 */
export declare function assessCommandSafety(command: string): {
    safe: boolean;
    risks: string[];
};
//# sourceMappingURL=security.d.ts.map