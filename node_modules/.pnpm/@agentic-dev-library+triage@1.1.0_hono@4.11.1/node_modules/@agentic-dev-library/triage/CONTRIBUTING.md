# Contributing to @agentic-dev-library/triage

Thank you for your interest in contributing to **Agentic**, the AI & Agents division of the [jbcom enterprise](https://jbcom.github.io). This guide will help you get started with the `@agentic-dev-library/triage` repository.

## 🏢 Enterprise Context

All Agentic repositories follow unified enterprise standards for documentation, branding, and cross-organization interconnections.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## Code of Conduct

This project follows the standard open source code of conduct. Be respectful, inclusive, and constructive in all interactions.

## Getting Started

### Prerequisites

- **Node.js**: >= 20 (22 recommended for all features)
- **pnpm**: 9.x (required, npm/yarn not supported)
- **Git**: Latest stable version

### First Time Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/triage.git
   cd triage
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/agentic-dev-library/triage.git
   ```

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

5. **Set up pre-commit hooks**:
   ```bash
   pnpm run prepare
   ```

6. **Build the project**:
   ```bash
   pnpm run build
   ```

7. **Run tests**:
   ```bash
   pnpm test
   ```

## Development Setup

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required for testing AI features
OLLAMA_API_KEY=your_ollama_api_key

# Optional
OLLAMA_HOST=https://ollama.com/api
OLLAMA_MODEL=qwen3-coder:480b

# For GitHub integration tests
GH_TOKEN=your_github_token
```

### Editor Setup

#### VS Code (Recommended)

Install recommended extensions:
- Biome (for linting and formatting)
- Vitest (for test running)
- TypeScript and JavaScript Language Features

#### Other Editors

Configure your editor to use:
- Biome for linting/formatting
- TypeScript language server
- Vitest for testing

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

### 2. Make Changes

- Write your code following the [Code Style](#code-style) guide
- Add tests for new functionality (see [TESTING.md](./TESTING.md))
- Update documentation as needed
- Keep commits small and focused

### 3. Verify Changes

Before committing, ensure:

```bash
# Format code
pnpm run format

# Lint code
pnpm run lint

# Run all checks (format + lint)
pnpm run check

# Type check
pnpm run typecheck

# Run tests
pnpm test

# Run tests with coverage
pnpm run test:coverage
```

The pre-commit hook will automatically run checks, but it's good to run them manually first.

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

See [Commit Guidelines](#commit-guidelines) for commit message format.

### 5. Keep Branch Updated

Regularly sync with upstream:

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push Changes

```bash
git push origin feature/your-feature-name
```

## Testing

All contributions must include tests. See [TESTING.md](./TESTING.md) for detailed testing guidelines.

### Test Coverage Requirements

- **Minimum coverage**: 75% for statements, branches, functions, and lines
- **New code**: Should have 100% coverage when practical
- **Bug fixes**: Must include regression tests

### Running Tests

```bash
# All tests
pnpm test

# With coverage
pnpm run test:coverage

# Watch mode
pnpm test -- --watch

# Specific file
pnpm test -- tests/ai.test.ts

# Match pattern
pnpm test -- -t "executor"
```

### Writing Tests

1. Place unit tests next to source files or in `tests/`
2. Use descriptive test names
3. Follow existing test patterns
4. Mock external dependencies
5. Use VCR for integration tests
6. Clean up resources in afterEach

Example:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('MyFeature', () => {
    beforeEach(() => {
        // Setup
    });

    afterEach(() => {
        // Cleanup
    });

    it('does something correctly', () => {
        // Arrange
        const input = 'test';
        
        // Act
        const result = myFunction(input);
        
        // Assert
        expect(result).toBe('expected');
    });
});
```

## Code Style

### Formatting and Linting

The project uses **Biome** for both linting and formatting:

- **Format**: `pnpm run format`
- **Lint**: `pnpm run lint`
- **Fix issues**: `pnpm run check:fix`

### TypeScript Guidelines

- Use **strict mode** (enabled in tsconfig.json)
- Prefer **const** over let
- Use **interfaces** for object shapes
- Use **type aliases** for unions and intersections
- Add **JSDoc comments** for public APIs
- Avoid **any** (use **unknown** if necessary)

### Naming Conventions

- **Files**: kebab-case (e.g., `test-results.ts`)
- **Classes**: PascalCase (e.g., `HttpRecorder`)
- **Functions**: camelCase (e.g., `executePlan`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_MODEL`)
- **Interfaces**: PascalCase (e.g., `ExecutorOptions`)
- **Type aliases**: PascalCase (e.g., `ToolSet`)

### Code Organization

```typescript
// 1. Imports (node built-ins first, then external, then internal)
import * as fs from 'node:fs';
import { generateText } from 'ai';
import { createPlan } from './plan.js';

// 2. Types and interfaces
export interface MyOptions {
    foo: string;
}

// 3. Constants
export const DEFAULT_VALUE = 'default';

// 4. Functions and classes
export function myFunction(options: MyOptions): void {
    // Implementation
}

// 5. Helper functions (not exported)
function helperFunction(): void {
    // Implementation
}
```

### Comments

- Use JSDoc for public APIs
- Avoid obvious comments
- Explain **why**, not **what**
- Keep comments up to date

```typescript
/**
 * Executes a plan with support for live, recorded, or sandbox execution.
 * 
 * @param plan - The execution plan to run
 * @param options - Execution options including mode and directories
 * @returns The completed plan with step results
 */
export async function executePlan(
    plan: ExecutionPlan,
    options: ExecutorOptions
): Promise<ExecutionPlan> {
    // Implementation
}
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples

```bash
feat(ai): add support for Anthropic provider
fix(executor): handle missing dependencies correctly
docs: update testing guide with VCR examples
test(recorder): add edge case tests for HTTP recording
chore: upgrade dependencies to latest versions
```

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the footer:

```
feat(api): change executor options interface

BREAKING CHANGE: ExecutorOptions.mode is now required instead of optional
```

## Pull Request Process

### Before Submitting

1. ✅ Tests pass locally (`pnpm test`)
2. ✅ Coverage meets 75% threshold
3. ✅ Code is formatted (`pnpm run format`)
4. ✅ No linting errors (`pnpm run lint`)
5. ✅ Type checks pass (`pnpm run typecheck`)
6. ✅ Documentation is updated
7. ✅ Commit messages follow conventions

### Creating the PR

1. **Push your branch** to your fork
2. **Open a pull request** against `main`
3. **Fill out the PR template**:
   - Description of changes
   - Related issues (use "Fixes #123")
   - Testing performed
   - Breaking changes (if any)
4. **Request review** from maintainers

### PR Title Format

Use the same format as commit messages:

```
feat(scope): description
fix(scope): description
docs: description
```

### During Review

- **Respond to feedback** promptly
- **Make requested changes** in new commits
- **Re-request review** after changes
- **Keep PR updated** with main branch
- **Be patient and respectful**

### After Approval

- Maintainers will merge your PR
- Your contribution will be included in the next release
- You'll be credited in release notes

## Project Structure

```
agentic-triage/
├── .github/              # GitHub workflows and templates
├── .husky/               # Git hooks (pre-commit)
├── src/                  # Source code
│   ├── index.ts          # Main entry point
│   ├── action.ts         # GitHub Action entry point
│   ├── github.ts         # GitHub API helpers
│   ├── handlers/         # Triage handlers
│   ├── schemas/          # Zod schemas for primitives
│   ├── tools/            # Vercel AI SDK tool definitions
│   ├── mcp.ts            # MCP server implementation
│   ├── octokit.ts        # Octokit client and GraphQL
│   └── playwright.ts     # Playwright integration
├── tests/                # Test files
├── dist/                 # Build output (gitignored)
├── coverage/             # Coverage reports (gitignored)
├── biome.json            # Biome config
├── tsconfig.json         # TypeScript config
├── vitest.config.ts      # Vitest config
├── package.json          # Dependencies and scripts
├── pnpm-lock.yaml        # pnpm lockfile
├── TESTING.md            # Testing guide
├── CONTRIBUTING.md       # This file
└── README.md             # Project README
```

## Getting Help

- **Documentation**: Check [README.md](./README.md) and [TESTING.md](./TESTING.md)
- **Issues**: Search [existing issues](https://github.com/agentic-dev-library/triage/issues)
- **Discussions**: Ask in [GitHub Discussions](https://github.com/agentic-dev-library/triage/discussions)
- **Discord**: Join our community (link in README)

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Biome Documentation](https://biomejs.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

## Recognition

Contributors are recognized in:
- Release notes
- GitHub contributors page
- Project README (for significant contributions)

Thank you for contributing to agentic-triage! 🎉
