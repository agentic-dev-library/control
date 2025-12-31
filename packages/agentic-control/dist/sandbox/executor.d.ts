/**
 * Main sandbox executor for running AI agents in containers
 */
import type { ContainerResult, SandboxOptions } from './types.js';
export declare class SandboxExecutor {
    private containerManager;
    private runtimes;
    constructor();
    execute(options: SandboxOptions): Promise<ContainerResult>;
    executeFleet(options: SandboxOptions[]): Promise<ContainerResult[]>;
}
//# sourceMappingURL=executor.d.ts.map