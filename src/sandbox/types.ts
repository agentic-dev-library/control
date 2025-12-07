/**
 * Sandbox execution types for isolated agent runtime
 */

export interface SandboxOptions {
    runtime?: 'claude' | 'cursor' | 'custom';
    prompt: string;
    model?: string;
    script?: string;
    timeout?: number;
}

export interface RuntimeOptions {
    model?: string;
    script?: string;
}

export interface RuntimeResult {
    success: boolean;
    error?: string;
    turns?: number;
    cost?: number;
    elapsed?: number;
}

export type RuntimeExecutor = (
    prompt: string,
    options?: RuntimeOptions
) => Promise<RuntimeResult>;
