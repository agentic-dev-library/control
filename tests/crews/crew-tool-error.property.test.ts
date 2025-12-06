/**
 * Property-based tests for CrewTool error handling
 * Feature: crew-tool-integration, Property 13: Error serialization and preservation
 * Validates: Requirements 3.3, 9.1, 9.2, 9.3, 9.5
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { CrewTool, CrewToolError } from '../../src/crews/crew-tool.js';

describe('CrewTool Error Handling Properties', () => {
  it('Property 13: Error serialization and preservation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (packageName, crewName, input) => {
          const crewTool = new CrewTool({
            pythonExecutable: 'uv',
            crewAgentsPath: './python',
            defaultTimeout: 5000,
          });

          const result = await crewTool.invokeCrew({
            package: packageName,
            crew: crewName,
            input,
          });

          // Should always have a result
          expect(result).toBeDefined();
          expect(typeof result.success).toBe('boolean');

          // If failed, should have error information
          if (!result.success) {
            expect(result.error).toBeDefined();
            expect(typeof result.error).toBe('string');
            expect(result.error!.length).toBeGreaterThan(0);

            // Should have exit code
            if (result.exitCode !== undefined) {
              expect(typeof result.exitCode).toBe('number');
              expect(result.exitCode).not.toBe(0);
            }
          }

          // Should always have duration
          expect(result.duration).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 10 }
    );
  }, 60000);

  it('should create CrewToolError with proper category', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.constantFrom('config', 'validation', 'subprocess', 'crew', 'communication'),
        (message, category) => {
          const error = new CrewToolError(message, category as any);
          
          expect(error).toBeInstanceOf(Error);
          expect(error).toBeInstanceOf(CrewToolError);
          expect(error.message).toBe(message);
          expect(error.category).toBe(category);
          expect(error.name).toBe('CrewToolError');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve error details', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.constantFrom('config', 'validation', 'subprocess', 'crew', 'communication'),
        fc.dictionary(fc.string(), fc.anything()),
        (message, category, details) => {
          const error = new CrewToolError(message, category as any, details);
          
          expect(error.details).toEqual(details);
        }
      ),
      { numRuns: 50 }
    );
  });
});
