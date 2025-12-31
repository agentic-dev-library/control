/**
 * Security utilities for safe error reporting and token sanitization
 */
/**
 * Sanitize error messages to remove sensitive tokens
 */
export declare function sanitizeError(error: string | Error): string;
/**
 * Sanitize environment variables from error messages
 */
export declare function sanitizeEnvironment(env: Record<string, string | undefined>): Record<string, string>;
/**
 * Create a safe error for logging that removes sensitive information
 */
export declare function createSafeError(message: string, originalError?: Error): Error;
/**
 * Safe console logging that sanitizes output
 */
export declare const safeConsole: {
    log: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
};
//# sourceMappingURL=security.d.ts.map