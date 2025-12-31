import { describe, expect, it } from 'vitest';
import { createIssueTool, getIssueTool, updateIssueTool } from '../src/tools/issue.js';

describe('Issue Tools', () => {
    it('should have correct descriptions', () => {
        expect(createIssueTool.description).toBe('Create a new issue in the issue tracker.');
        expect(getIssueTool.description).toBe('Get detailed issue by ID.');
        expect(updateIssueTool.description).toBe('Update issue fields.');
    });
});
