/**
 * Property-based tests for CrewTool input validation
 * Feature: crew-tool-integration, Property 8: Input validation before execution
 * Validates: Requirements 6.3
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { validateInvokeOptions } from '../../src/crews/types.js';

describe('CrewTool Input Validation Properties', () => {
  it('Property 8: Input validation before execution', () => {
    fc.assert(
      fc.property(
        fc.record({
          package: fc.string(),
          crew: fc.string(),
          input: fc.string(),
          timeout: fc.option(fc.integer(), { nil: undefined }),
          env: fc.option(fc.dictionary(fc.string(), fc.string()), { nil: undefined }),
        }),
        (options) => {
          // Check if options are valid
          const packageValid = /^[a-zA-Z0-9_-]+$/.test(options.package) && options.package.length > 0;
          const crewValid = /^[a-zA-Z0-9_-]+$/.test(options.crew) && options.crew.length > 0;
          const timeoutValid = options.timeout === undefined || options.timeout > 0;

          const isValid = packageValid && crewValid && timeoutValid;

          if (isValid) {
            // Valid options should parse successfully
            const result = validateInvokeOptions(options);
            expect(result).toBeDefined();
            expect(result.package).toBe(options.package);
            expect(result.crew).toBe(options.crew);
            expect(result.input).toBe(options.input);
            return true;
          }

          // Invalid options should throw
          expect(() => validateInvokeOptions(options)).toThrow();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate package name format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (packageName) => {
          const options = {
            package: packageName,
            crew: 'valid-crew',
            input: 'test',
          };
          const result = validateInvokeOptions(options);
          expect(result.package).toBe(packageName);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject invalid package names', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => !/^[a-zA-Z0-9_-]+$/.test(s)),
        (packageName) => {
          const options = {
            package: packageName,
            crew: 'valid-crew',
            input: 'test',
          };
          expect(() => validateInvokeOptions(options)).toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should validate crew name format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        (crewName) => {
          const options = {
            package: 'valid-package',
            crew: crewName,
            input: 'test',
          };
          const result = validateInvokeOptions(options);
          expect(result.crew).toBe(crewName);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject invalid crew names', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => !/^[a-zA-Z0-9_-]+$/.test(s)),
        (crewName) => {
          const options = {
            package: 'valid-package',
            crew: crewName,
            input: 'test',
          };
          expect(() => validateInvokeOptions(options)).toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept any input string', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (input) => {
          const options = {
            package: 'valid-package',
            crew: 'valid-crew',
            input,
          };
          const result = validateInvokeOptions(options);
          expect(result.input).toBe(input);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should validate positive timeout values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        (timeout) => {
          const options = {
            package: 'valid-package',
            crew: 'valid-crew',
            input: 'test',
            timeout,
          };
          const result = validateInvokeOptions(options);
          expect(result.timeout).toBe(timeout);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject non-positive timeout values', () => {
    fc.assert(
      fc.property(
        fc.integer({ max: 0 }),
        (timeout) => {
          const options = {
            package: 'valid-package',
            crew: 'valid-crew',
            input: 'test',
            timeout,
          };
          expect(() => validateInvokeOptions(options)).toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });
});
