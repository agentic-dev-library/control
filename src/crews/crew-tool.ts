/**
 * CrewTool - TypeScript interface for invoking Python crew-agents
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import type {
    CrewInfo,
    CrewResult,
    CrewToolConfig,
    InvokeCrewOptions,
} from './types.js';
import { validateConfig, validateInvokeOptions } from './types.js';

/**
 * Error categories for crew tool operations
 */
export type CrewToolErrorCategory = 'config' | 'validation' | 'subprocess' | 'crew' | 'communication';

/**
 * Custom error class for crew tool operations
 */
export class CrewToolError extends Error {
  constructor(
    message: string,
    public category: CrewToolErrorCategory,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CrewToolError';
  }
}

/**
 * Crew tool for invoking Python crew-agents from TypeScript
 * 
 * @example Standalone usage
 * ```typescript
 * const crewTool = new CrewTool({
 *   pythonExecutable: 'uv',
 *   crewAgentsPath: './python',
 * });
 * 
 * const result = await crewTool.invokeCrew({
 *   package: 'otterfall',
 *   crew: 'game_builder',
 *   input: 'Create a QuestComponent',
 * });
 * ```
 */
export class CrewTool {
  private config: Required<CrewToolConfig>;

  constructor(config?: CrewToolConfig) {
    const validated = validateConfig(config ?? {});
    
    // Apply defaults and detect paths
    this.config = {
      pythonExecutable: validated.pythonExecutable ?? 'uv',
      crewAgentsPath: validated.crewAgentsPath ?? this.detectCrewAgentsPath(),
      defaultTimeout: validated.defaultTimeout ?? 300000,
      env: validated.env ?? {},
    };
  }

  /**
   * Auto-detect crew-agents package location
   */
  private detectCrewAgentsPath(): string {
    // Try common locations
    const candidates = [
      './python',
      '../python',
      '../../python',
      process.cwd() + '/python',
    ];

    for (const path of candidates) {
      if (existsSync(join(path, 'pyproject.toml'))) {
        return path;
      }
    }

    // Default to ./python
    return './python';
  }



  /**
   * List all available crews across all packages
   */
  async listCrews(): Promise<CrewInfo[]> {
    try {
      const result = await this.executeCommand(['list']);
      
      if (!result.success) {
        throw new CrewToolError(
          `Failed to list crews: ${result.error}`,
          'crew',
          { exitCode: result.exitCode }
        );
      }

      // Parse output to extract crew information
      return this.parseCrewList(result.output ?? '');
    } catch (error) {
      if (error instanceof CrewToolError) {
        throw error;
      }
      throw new CrewToolError(
        `Unexpected error listing crews: ${(error as Error).message}`,
        'subprocess',
        { originalError: error }
      );
    }
  }

  /**
   * Parse crew list output
   */
  private parseCrewList(output: string): CrewInfo[] {
    const crews: CrewInfo[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Expected format: "package.crew - description"
      const match = trimmed.match(/^([^.]+)\.([^\s-]+)\s*-\s*(.+)$/);
      if (match) {
        crews.push({
          package: match[1],
          name: match[2],
          description: match[3],
        });
      }
    }

    return crews;
  }

  /**
   * Get detailed information about a specific crew
   */
  async getCrewInfo(packageName: string, crewName: string): Promise<CrewInfo> {
    try {
      const result = await this.executeCommand(['info', packageName, crewName]);
      
      if (!result.success) {
        throw new CrewToolError(
          `Failed to get crew info: ${result.error}`,
          'crew',
          { package: packageName, crew: crewName, exitCode: result.exitCode }
        );
      }

      // Parse output to extract crew information
      return this.parseCrewInfo(packageName, crewName, result.output ?? '');
    } catch (error) {
      if (error instanceof CrewToolError) {
        throw error;
      }
      throw new CrewToolError(
        `Unexpected error getting crew info: ${(error as Error).message}`,
        'subprocess',
        { originalError: error }
      );
    }
  }

  /**
   * Parse crew info output
   */
  private parseCrewInfo(packageName: string, crewName: string, output: string): CrewInfo {
    // Extract description from output
    const lines = output.split('\n');
    let description = '';

    for (const line of lines) {
      if (line.includes('Description:')) {
        description = line.split('Description:')[1]?.trim() ?? '';
        break;
      }
    }

    return {
      package: packageName,
      name: crewName,
      description: description || 'No description available',
    };
  }

  /**
   * Invoke a crew with the given input
   */
  async invokeCrew(options: InvokeCrewOptions): Promise<CrewResult> {
    const startTime = Date.now();

    try {
      // Validate options
      const validated = validateInvokeOptions(options);

      // Execute crew
      const result = await this.executeCommand(
        ['run', validated.package, validated.crew, '--input', validated.input],
        {
          timeout: validated.timeout ?? this.config.defaultTimeout,
          env: { ...this.config.env, ...validated.env },
        }
      );

      return {
        ...result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      if (error instanceof CrewToolError) {
        return {
          success: false,
          error: error.message,
          duration: Date.now() - startTime,
        };
      }

      return {
        success: false,
        error: `Unexpected error: ${(error as Error).message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute a crew-agents CLI command
   */
  private async executeCommand(
    args: string[],
    options?: { timeout?: number; env?: Record<string, string> }
  ): Promise<CrewResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const timeout = options?.timeout ?? this.config.defaultTimeout;
      const env = { ...process.env, ...this.config.env, ...options?.env };

      // Spawn subprocess
      const proc = spawn(
        this.config.pythonExecutable,
        ['run', 'crew-agents', ...args],
        {
          cwd: this.config.crewAgentsPath,
          env,
        }
      );

      let stdout = '';
      let stderr = '';
      let killed = false;

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        killed = true;
        proc.kill('SIGTERM');
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (!proc.killed) {
            proc.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);

      // Collect output
      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle completion
      proc.on('exit', (code) => {
        clearTimeout(timeoutHandle);

        if (killed) {
          resolve({
            success: false,
            error: `Crew execution timed out after ${timeout}ms`,
            output: stdout.trim(),
            exitCode: code ?? 1,
            duration: Date.now() - startTime,
          });
          return;
        }

        if (code === 0) {
          resolve({
            success: true,
            output: stdout.trim(),
            exitCode: code,
            duration: Date.now() - startTime,
          });
        } else {
          resolve({
            success: false,
            error: stderr.trim() || 'Crew execution failed',
            output: stdout.trim(),
            exitCode: code ?? 1,
            duration: Date.now() - startTime,
          });
        }
      });

      // Handle spawn errors
      proc.on('error', (error) => {
        clearTimeout(timeoutHandle);
        resolve({
          success: false,
          error: `Failed to spawn process: ${error.message}`,
          duration: Date.now() - startTime,
        });
      });
    });
  }
}
