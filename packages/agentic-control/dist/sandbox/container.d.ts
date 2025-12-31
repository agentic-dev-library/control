/**
 * Docker container lifecycle management
 */
import type { ContainerConfig, ContainerResult } from './types.js';
export declare class ContainerManager {
    create(config: ContainerConfig): Promise<string>;
    start(containerId: string): Promise<void>;
    stop(containerId: string): Promise<void>;
    remove(containerId: string): Promise<void>;
    exec(containerId: string, command: string[]): Promise<ContainerResult>;
    logs(containerId: string): Promise<string>;
    private getImageForRuntime;
}
//# sourceMappingURL=container.d.ts.map