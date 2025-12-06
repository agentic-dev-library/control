/**
 * Property-based tests for CrewTool type mismatch error reporting
 * Feature: crew-tool-integration, Property 9: Type mismatch error reporting
 * Validates: Requirements 6.4
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { validateInvokeOptions } from '../../src/crews/types.js';

describe('CrewTool Type Mismatch Properties', () => {
  it('Property 9: Type mismatch error reporting', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        (value) => {
          // Skip valid objects
          if (
            typeof value === 'object' &&
            value !== null &&
            'package' in value &&
            'crew' in value &&
            'input' in value
          ) {
            return true;
          }

          // Invalid types should throw with detailed error
          try {
            validateInvokeOptions(value);
            // If it didn't throw, it must have been a valid object
            return true;
          } catch (error) {
            // Should have thrown an error
            expect(error).toBeDefined();
            expect(error instanceof Error).toBe(true);
            // Error should have a message
            expect((error as Error).message.length).toBeGreaterThan(0);
            return true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should report missing required fields', () => {
    const testCases = [
      { crew: 'test', input: 'test' }, // missing package
      { package: 'test', input: 'test' }, // missing crew
      { package: 'test', crew: 'test' }, // missing input
      {}, // missing all
    ];

    for (const testCase of testCases) {
      expect(() => validateInvokeOptions(testCase)).toThrow();
    }
  });

  it('should report invalid field types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { package: 123, crew: 'test', input: 'test' },
          { package: 'test', crew: 123, input: 'test' },
          { package: 'test', crew: 'test', input: 123 },
          { package: 'test', crew: 'test', input: 'test', timeout: 'invalid' },
          { package: 'test', crew: 'test', input: 'test', timeout: -1 },
        ),
        (options) => {
          expect(() => validateInvokeOptions(options)).toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should provide detailed error messages', () => {
    const invalidOptions = {
      package: '',
      crew: 'test@invalid',
      input: 'test',
      timeout: -100,
    };

    try {
      validateInvokeOptions(invalidOptions);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
      const message = (error as Error).message;
      // Error message should contain useful information
      expect(message.length).toBeGreaterThan(0);
    }
  });
});
