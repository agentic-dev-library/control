/**
 * Property-based tests for CrewTool subprocess execution
 * Feature: crew-tool-integration, Property 4: Crew invocation subprocess execution
 * Validates: Requirements 3.2, 3.5, 7.1
 */

import fc from 'fast-check';
import { existsSync } from 'fs';
import { join } from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { CrewTool } from '../../src/crews/crew-tool.js';

describe('CrewTool Subprocess Execution Properties', () => {
  let crewTool: CrewTool;
  let hasPython = false;

  beforeAll(() => {
    // Check if Python environment is available
    hasPython = existsSync(join(process.cwd(), 'python', 'pyproject.toml'));
    
    if (hasPython) {
      crewTool = new CrewTool({
        pythonExecutable: 'uv',
        crewAgentsPath: './python',
        defaultTimeout: 30000,
      });
    }
  });

  it('Property 4: Crew invocation subprocess execution', async () => {
    if (!hasPython) {
      console.log('Skipping test: Python environment not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('test-package', 'otterfall', 'example'),
        fc.constantFrom('test-crew', 'game_builder', 'example-crew'),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (packageName, crewName, input) => {
          const result = await crewTool.invokeCrew({
            package: packageName,
            crew: crewName,
            input,
          });

          // Result should always have success field
          expect(result).toHaveProperty('success');
          expect(typeof result.success).toBe('boolean');

          // If successful, should have output
          if (result.success) {
            expect(result).toHaveProperty('output');
            expect(typeof result.output).toBe('string');
          } else {
            // If failed, should have error
            expect(result).toHaveProperty('error');
            expect(typeof result.error).toBe('string');
          }

          // Should always have duration
          expect(result).toHaveProperty('duration');
          expect(typeof result.duration).toBe('number');
          expect(result.duration).toBeGreaterThanOrEqual(0);

          // Should have exit code
          if (result.exitCode !== undefined) {
            expect(typeof result.exitCode).toBe('number');
          }
        }
      ),
      { numRuns: 10 } // Reduced runs for subprocess tests
    );
  }, 60000); // 60 second timeout for subprocess tests
});
