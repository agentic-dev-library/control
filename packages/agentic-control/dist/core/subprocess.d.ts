/**
 * Safe subprocess execution utilities
 */
import { type SpawnOptions, type SpawnSyncOptions } from 'node:child_process';
/**
 * Safely execute a command with array-based arguments (no shell interpolation)
 */
export declare function safeSpawnSync(command: string, args?: string[], options?: SpawnSyncOptions): {
    success: boolean;
    stdout: string;
    stderr: string;
    code: number | null;
};
/**
 * Safely execute a command asynchronously with array-based arguments
 */
export declare function safeSpawn(command: string, args?: string[], options?: SpawnOptions): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    code: number | null;
}>;
/**
 * Validate command arguments to prevent injection
 */
export declare function validateCommandArgs(args: string[]): void;
/**
 * Safely execute git commands with validation
 */
export declare function safeGitCommand(args: string[], options?: SpawnSyncOptions): {
    success: boolean;
    stdout: string;
    stderr: string;
    code: number | null;
};
/**
 * Safely execute docker commands with validation
 */
export declare function safeDockerCommand(args: string[], options?: SpawnSyncOptions): {
    success: boolean;
    stdout: string;
    stderr: string;
    code: number | null;
};
//# sourceMappingURL=subprocess.d.ts.map