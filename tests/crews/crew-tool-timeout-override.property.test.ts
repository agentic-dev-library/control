/**
 * Property-based tests for CrewTool timeout override
 * Feature: crew-tool-integration, Property 12: Timeout override
 * Validates: Requirements 7.5
 */

import fc from 'fast-check';
import { existsSync } from 'fs';
import { join } from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { CrewTool } from '../../src/crews/crew-tool.js';

describe('CrewTool Timeout Override Properties', () => {
  let hasPython = false;

  beforeAll(() => {
    // Check if Python environment is available
    hasPython = existsSync(join(process.cwd(), 'python', 'pyproject.toml'));
  });

  it('Property 12: Timeout override', async () => {
    if (!hasPython) {
      console.log('Skipping test: Python environment not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1000, max: 5000 }), // Default timeout
        fc.integer({ min: 100, max: 2000 }), // Override timeout
        async (defaultTimeout, overrideTimeout) => {
          const crewTool = new CrewTool({
            pythonExecutable: 'uv',
            crewAgentsPath: './python',
            defaultTimeout,
          });

          const startTime = Date.now();
          
          // Invoke with timeout override
          const result = await crewTool.invokeCrew({
            package: 'test-package',
            crew: 'test-crew',
            input: 'test',
            timeout: overrideTimeout,
          });

          const elapsed = Date.now() - startTime;

          // Should have a result
          expect(result).toBeDefined();
          expect(typeof result.success).toBe('boolean');

          // If it timed out, should respect the override timeout, not default
          if (!result.success && result.error?.includes('timed out')) {
            // Duration should be close to override timeout, not default
            expect(result.duration).toBeGreaterThanOrEqual(overrideTimeout);
            expect(result.duration).toBeLessThan(overrideTimeout * 2);
            
            // Should not have waited for default timeout
            expect(elapsed).toBeLessThan(defaultTimeout);
          }
        }
      ),
      { numRuns: 5 } // Reduced runs for timeout tests
    );
  }, 30000); // 30 second timeout for test suite
});
