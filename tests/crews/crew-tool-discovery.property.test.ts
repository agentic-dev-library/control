/**
 * Property-based tests for CrewTool crew discovery
 * Feature: crew-tool-integration, Property 5: Crew discovery via CLI
 * Validates: Requirements 5.2
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { CrewTool } from '../../src/crews/crew-tool.js';

describe('CrewTool Discovery Properties', () => {
  let crewTool: CrewTool;
  let hasPython = false;

  beforeAll(() => {
    // Check if Python environment is available
    hasPython = existsSync(join(process.cwd(), 'python', 'pyproject.toml'));
    
    if (hasPython) {
      crewTool = new CrewTool({
        pythonExecutable: 'uv',
        crewAgentsPath: './python',
      });
    }
  });

  it('Property 5: Crew discovery via CLI', async () => {
    if (!hasPython) {
      console.log('Skipping test: Python environment not available');
      return;
    }

    const crews = await crewTool.listCrews();

    // Should return an array
    expect(Array.isArray(crews)).toBe(true);

    // Each crew should have required fields
    for (const crew of crews) {
      expect(crew).toHaveProperty('package');
      expect(crew).toHaveProperty('name');
      expect(crew).toHaveProperty('description');
      
      expect(typeof crew.package).toBe('string');
      expect(typeof crew.name).toBe('string');
      expect(typeof crew.description).toBe('string');
      
      expect(crew.package.length).toBeGreaterThan(0);
      expect(crew.name.length).toBeGreaterThan(0);
    }
  }, 30000);

  it('should get crew info for discovered crews', async () => {
    if (!hasPython) {
      console.log('Skipping test: Python environment not available');
      return;
    }

    const crews = await crewTool.listCrews();

    if (crews.length > 0) {
      const firstCrew = crews[0];
      const info = await crewTool.getCrewInfo(firstCrew.package, firstCrew.name);

      expect(info).toBeDefined();
      expect(info.package).toBe(firstCrew.package);
      expect(info.name).toBe(firstCrew.name);
      expect(typeof info.description).toBe('string');
    }
  }, 30000);
});
