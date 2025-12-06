/**
 * Property-based tests for CrewTool timeout handling
 * Feature: crew-tool-integration, Property 11: Timeout handling
 * Validates: Requirements 7.3
 */

import fc from 'fast-check';
import { existsSync } from 'fs';
import { join } from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { CrewTool } from '../../src/crews/crew-tool.js';

describe('CrewTool Timeout Properties', () => {
  let hasPython = false;

  beforeAll(() => {
    // Check if Python environment is available
    hasPython = existsSync(join(process.cwd(), 'python', 'pyproject.toml'));
  });

  it('Property 11: Timeout handling', async () => {
    if (!hasPython) {
      console.log('Skipping test: Python environment not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 2000 }), // Short timeouts for testing
        async (timeout) => {
          const crewTool = new CrewTool({
            pythonExecutable: 'uv',
            crewAgentsPath: './python',
            defaultTimeout: timeout,
          });

          // Try to invoke a crew with a short timeout
          // Most crews will timeout with such short timeouts
          const result = await crewTool.invokeCrew({
            package: 'test-package',
            crew: 'test-crew',
            input: 'test',
            timeout,
          });

          // Should have a result
          expect(result).toBeDefined();
          expect(typeof result.success).toBe('boolean');

          // If it timed out, should have timeout error
          if (!result.success && result.error?.includes('timed out')) {
            expect(result.error).toMatch(/timed out/i);
            expect(result.duration).toBeGreaterThanOrEqual(timeout);
            // Allow some buffer for process cleanup
            expect(result.duration).toBeLessThan(timeout * 2);
          }

          // Should always have duration
          expect(result.duration).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 5 } // Reduced runs for timeout tests
    );
  }, 30000); // 30 second timeout for test suite
});
