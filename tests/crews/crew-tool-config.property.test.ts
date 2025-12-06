/**
 * Property-based tests for CrewTool configuration validation
 * Feature: crew-tool-integration, Property 7: Configuration validation errors
 * Validates: Requirements 5.5
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { validateConfig } from '../../src/crews/types.js';

describe('CrewTool Configuration Properties', () => {
  it('Property 7: Configuration validation errors', () => {
    fc.assert(
      fc.property(
        fc.record({
          pythonExecutable: fc.option(fc.string(), { nil: undefined }),
          crewAgentsPath: fc.option(fc.string(), { nil: undefined }),
          defaultTimeout: fc.option(fc.integer(), { nil: undefined }),
        }),
        (config) => {
          // Filter to only invalid configs
          const isInvalid = 
            config.defaultTimeout !== undefined && config.defaultTimeout <= 0;
          
          if (!isInvalid) {
            // Valid configs should parse successfully
            const result = validateConfig(config);
            expect(result).toBeDefined();
            expect(result.pythonExecutable).toBe(config.pythonExecutable ?? 'uv');
            expect(result.defaultTimeout).toBeGreaterThan(0);
            return true;
          }
          
          // Invalid config should throw validation error
          expect(() => validateConfig(config)).toThrow();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate positive timeout values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }),
        (timeout) => {
          const config = { defaultTimeout: timeout };
          const result = validateConfig(config);
          expect(result.defaultTimeout).toBe(timeout);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject negative timeout values', () => {
    fc.assert(
      fc.property(
        fc.integer({ max: 0 }),
        (timeout) => {
          const config = { defaultTimeout: timeout };
          expect(() => validateConfig(config)).toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should apply default values for missing fields', () => {
    const result = validateConfig({});
    expect(result.pythonExecutable).toBe('uv');
    expect(result.defaultTimeout).toBe(300000);
  });
});
