# Testing Guide

This document describes the testing strategy, infrastructure, and best practices for the agentic-triage project.

## Overview

The project maintains a comprehensive test suite targeting **>75% code coverage** across:
- Unit tests with mocks
- Integration tests with VCR (cassette-based HTTP recording)
- End-to-end tests with deterministic test repositories

## Test Structure

```
tests/
├── ai.test.ts                          # Unit tests for AI client
├── test-results.test.ts                # Unit tests for test result parsing
├── cassettes/                          # VCR recordings for integration tests
│   ├── ai-providers/                   # AI provider cassettes
│   └── github-api-root.json           # Sample GitHub API cassette
├── execution/                          # Tests for execution engine
│   ├── executor.test.ts               # Core executor tests
│   ├── executor-branches.test.ts      # Branch coverage tests
│   ├── executor-expanded.test.ts      # Expanded coverage tests
│   ├── fixtures.test.ts               # Fixture generation tests
│   ├── mock-mcp.test.ts               # Mock MCP provider tests
│   ├── plan.test.ts                   # Plan structure tests
│   ├── planner.test.ts                # Planning logic tests
│   ├── recorder.test.ts               # VCR recorder tests
│   ├── recorder-branches.test.ts      # Recorder branch coverage
│   ├── sandbox.test.ts                # Sandbox execution tests
│   └── sandbox-branches.test.ts       # Sandbox branch coverage
└── integration/                        # Integration tests
    ├── vcr-http.integration.test.ts   # VCR HTTP integration
    └── ai-providers.integration.test.ts # AI provider integration

```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run dev &
npm test -- --watch

# Run specific test file
npm test -- tests/ai.test.ts

# Run tests matching a pattern
npm test -- -t "executor"
```

### Coverage Thresholds

The project enforces minimum coverage thresholds:
- Statements: 75%
- Branches: 75%
- Functions: 75%
- Lines: 75%

Coverage reports are generated in `./coverage/` directory:
- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI integrations
- `coverage/coverage-final.json` - JSON format for tooling

## Unit Testing

### Mocking Strategy

Unit tests use **vi.mock()** from Vitest to mock external dependencies:

```typescript
import { vi } from 'vitest';

// Hoist mocks before imports
const { generateTextMock } = vi.hoisted(() => ({
    generateTextMock: vi.fn(async () => ({ text: 'mocked' }))
}));

vi.mock('ai', () => ({
    generateText: generateTextMock
}));

import { generate } from '../src/ai.ts';

describe('AI Client', () => {
    it('calls generateText with correct params', async () => {
        await generate('test prompt');
        expect(generateTextMock).toHaveBeenCalledWith(
            expect.objectContaining({ prompt: 'test prompt' })
        );
    });
});
```

### Test Fixtures

For filesystem operations, use temporary directories:

```typescript
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

describe('File Operations', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('reads file', async () => {
        const testFile = path.join(tmpDir, 'test.txt');
        fs.writeFileSync(testFile, 'content');
        // ... test logic
    });
});
```

## Integration Testing with VCR

### VCR Pattern

The project uses a **VCR (Video Cassette Recorder)** pattern for HTTP interactions:
1. **Record mode**: Makes real HTTP requests and saves responses to cassettes
2. **Playback mode**: Replays responses from cassettes (no network required)
3. **Passthrough mode**: Always makes live requests (for debugging)

### Using the Recorder

```typescript
import { withRecording } from '../../src/execution/recorder.ts';
import * as path from 'node:path';

const FIXTURES_DIR = path.join(process.cwd(), 'tests', 'cassettes');

describe('API Integration', () => {
    it('fetches data from API', async () => {
        const result = await withRecording(
            'API Test Name',
            FIXTURES_DIR,
            'playback',  // or 'record' or 'passthrough'
            async () => {
                const res = await fetch('https://api.example.com/data');
                return res.json();
            }
        );

        expect(result).toHaveProperty('data');
    });
});
```

### Recording New Cassettes

To record new HTTP interactions:

1. Set mode to `'record'`:
   ```typescript
   await withRecording('test-name', FIXTURES_DIR, 'record', async () => {
       // Make HTTP calls here
   });
   ```

2. Run the test:
   ```bash
   npm test -- tests/integration/your-test.test.ts
   ```

3. Cassettes are saved to `tests/cassettes/test-name.json`

4. Change mode back to `'playback'` for CI

### AI Provider Integration Tests

Tests for AI providers use VCR to avoid requiring API keys in CI:

```typescript
describe('Ollama Provider', () => {
    it.skipIf(process.env.CI && !process.env.OLLAMA_API_KEY)(
        'generates text',
        async () => {
            const result = await withRecording(
                'ollama-generate',
                FIXTURES_DIR,
                'playback',
                async () => await generate('test prompt')
            );
            expect(result).toBeTruthy();
        }
    );
});
```

## Sandbox Execution

For tests that need a full repository with issues, PRs, and files:

```typescript
import { generateFromScenario } from '../../src/execution/fixtures.ts';

describe('Full Repository Tests', () => {
    it('executes plan in fixture repo', async () => {
        const fixturesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fixtures-'));
        
        try {
            const fixture = await generateFromScenario('bug-report', fixturesDir);
            
            // fixture.root contains a git repo with:
            // - src/ directory with TypeScript files
            // - Mock issues and PRs
            // - Git history
            
            // Run your test logic here
            
        } finally {
            fs.rmSync(fixturesDir, { recursive: true, force: true });
        }
    });
});
```

### Available Scenarios

- `bug-report` - Simple bug fix scenario
- `feature-request` - Feature implementation scenario  
- `refactoring` - Code refactoring scenario

## Coverage Exclusions

Certain files are excluded from coverage requirements:

- CLI entry points (`src/cli.ts`)
- Command wiring (`src/commands/**`)
- MCP client setup (`src/mcp.ts`, `src/octokit.ts`)
- Reporters (`src/reporters/**`)
- Stub implementations (`src/execution/github-sandbox.ts`)
- Non-critical utilities (`src/execution/tokenizer.ts`)

These are tested via end-to-end workflows rather than unit tests.

## CI Integration

### GitHub Actions

Tests run automatically on every PR and push to main:

```yaml
- name: Run tests with coverage
  run: pnpm run test:coverage

- name: Report Coveralls
  uses: coverallsapp/github-action@v2
```

### Coverage Reporting

Coverage is reported to [Coveralls](https://coveralls.io/github/jbdevprimary/agentic-triage) and displayed as a badge on the README.

## Best Practices

### DO

✅ Write focused, single-purpose tests  
✅ Use descriptive test names that explain the scenario  
✅ Mock external dependencies in unit tests  
✅ Use VCR for integration tests with external APIs  
✅ Clean up temporary files and directories  
✅ Skip tests conditionally when dependencies unavailable  
✅ Test error conditions and edge cases  

### DON'T

❌ Make real API calls in unit tests  
❌ Commit API keys or secrets in cassettes  
❌ Write tests that depend on specific timing  
❌ Leave temporary files on disk  
❌ Test implementation details instead of behavior  
❌ Write tests that depend on each other  

## Debugging Tests

### Running a Single Test

```bash
npm test -- tests/ai.test.ts -t "specific test name"
```

### Verbose Output

```bash
npm test -- --reporter=verbose
```

### Debugging with VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal"
}
```

## Writing New Tests

1. **Identify the scope**: Unit, integration, or E2E?
2. **Choose the right tools**: Mocks for unit, VCR for integration
3. **Write the test**: Follow existing patterns in similar test files
4. **Run and verify**: Ensure it passes and increases coverage
5. **Document special setup**: If test requires specific configuration

## Maintenance

### Updating Cassettes

When APIs change, regenerate cassettes:

```bash
# 1. Switch to record mode in test file
# 2. Run tests with API keys
OLLAMA_API_KEY=xxx npm test -- tests/integration/
# 3. Commit updated cassettes
# 4. Switch back to playback mode
```

### Fixing Flaky Tests

If a test fails intermittently:
1. Check for timing dependencies
2. Verify proper cleanup in afterEach
3. Ensure test isolation (no shared state)
4. Check for resource leaks (temp files, network connections)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [VCR Pattern](https://github.com/vcr/vcr)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Coverage Reports](./coverage/lcov-report/index.html)

## Getting Help

For questions about testing:
1. Check this guide first
2. Look at similar existing tests
3. Open an issue with the `testing` label
4. Ask in project discussions
