/**
 * Property-based tests for CrewTool error type distinction
 * Feature: crew-tool-integration, Property 14: Error type distinction
 * Validates: Requirements 9.4
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CrewTool } from '../../src/crews/crew-tool.js';

describe('CrewTool Error Type Distinction Properties', () => {
  it('Property 14: Error type distinction', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          { pythonExecutable: '/nonexistent/python', category: 'subprocess' },
          { pythonExecutable: 'uv', crewAgentsPath: '/nonexistent/path', category: 'subprocess' },
        ),
        async (config) => {
          const crewTool = new CrewTool(config);

          const result = await crewTool.invokeCrew({
            package: 'test-package',
            crew: 'test-crew',
            input: 'test',
          });

          // Should fail
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();

          // Error should indicate subprocess/communication failure
          // not crew execution failure
          const errorLower = result.error!.toLowerCase();
          const isSubprocessError = 
            errorLower.includes('spawn') ||
            errorLower.includes('enoent') ||
            errorLower.includes('not found') ||
            errorLower.includes('failed to');

          // For subprocess errors, we expect them to be distinguished
          if (config.category === 'subprocess') {
            expect(isSubprocessError).toBe(true);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 30000);

  it('should distinguish validation errors from execution errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter(s => !/^[a-zA-Z0-9_-]+$/.test(s) && s.length > 0),
        async (invalidName) => {
          const crewTool = new CrewTool();

          // Invalid package/crew names should throw validation errors
          await expect(
            crewTool.invokeCrew({
              package: invalidName,
              crew: 'valid-crew',
              input: 'test',
            })
          ).rejects.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });
});
