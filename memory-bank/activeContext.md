# Active Context

## agentic-control v1.1.0 - PNPM MONOREPO ✅

Unified AI agent fleet management, triage, and orchestration toolkit.

### Monorepo Structure (NEW)

The project has been converted to a pnpm workspace monorepo, following the pattern from `agentic-crew`:

```
/workspace/
├── pnpm-workspace.yaml          # Workspace configuration
├── packages/
│   ├── agentic-control/         # Main CLI and runtime package (npm)
│   │   ├── src/                 # TypeScript source
│   │   ├── tests/               # Tests using vitest-agentic-control
│   │   └── package.json
│   └── vitest-agentic-control/  # Vitest plugin for E2E testing (npm)
│       ├── src/                 # Plugin source
│       │   ├── index.ts         # Main exports
│       │   ├── mocking.ts       # AgenticMocker class
│       │   ├── mcp.ts           # MCP server mocking
│       │   ├── providers.ts     # AI provider mocking
│       │   ├── sandbox.ts       # Container/sandbox mocking
│       │   └── fixtures.ts      # Test configurations
│       ├── tests/               # Plugin tests
│       └── package.json
└── python/                      # Python CrewAI companion (PyPI)
```

### vitest-agentic-control Plugin

The new testing plugin provides:

- **MCP Mocking**: Mock MCP servers, tools, and resources
- **Provider Mocking**: Mock AI providers (Anthropic, OpenAI, Google, Mistral, Azure, Ollama)
- **Sandbox Mocking**: Mock Docker container execution
- **Test Fixtures**: Pre-configured fixtures for tokens, fleet, triage, sandbox
- **Environment Helpers**: Easy setup/cleanup of test environment variables

**Dogfooding**: The main `agentic-control` package uses `vitest-agentic-control` for its own tests, demonstrating the plugin's capabilities.

### Test Status

- **82 tests passing** (23 vitest-agentic-control + 59 agentic-control)
- Workspace-level `pnpm run build` and `pnpm run test` commands work
- Both packages build and test independently

### Development Commands

```bash
# Install dependencies (workspace)
pnpm install

# Build all packages
pnpm run build

# Test all packages
pnpm run test

# Build specific package
pnpm -F agentic-control build
pnpm -F vitest-agentic-control build

# Test specific package
pnpm -F agentic-control test
pnpm -F vitest-agentic-control test

# Format
pnpm run format
```

### Key Features

- **Multi-org token management** with automatic switching
- **AI-powered triage** (Anthropic, OpenAI, Google, Mistral, Azure, Ollama)
- **Sandbox execution** with Docker isolation
- **Fleet coordination** and agent handoff protocols
- **MCP server mocking** for E2E testing
- **Provider mocking** for unit testing without API calls

### Architecture

- **packages/agentic-control**: Main TypeScript package
  - CLI, fleet management, triage, GitHub integration, sandbox execution
  - Exports: Fleet, AIAnalyzer, SandboxExecutor, GitHubClient, HandoffManager

- **packages/vitest-agentic-control**: Testing plugin
  - AgenticMocker, McpMocker, ProviderMocker, SandboxMocker
  - Test fixtures and environment helpers

- **python/**: Python CrewAI agents (companion package)

---
*Monorepo conversion completed: 2025-12-15*
*Similar pattern to agentic-crew uv workspace*
## Session: 2025-12-24
- Fixed CI failures in PR #20 by addressing Biome linting and Docker build issues.
- Resolved Biome formatting error in packages/agentic-control/src/cli.ts.
- Fixed Dockerfile to ensure PNPM_HOME subdirectories exist for symlinks.
- Verified all tests (59) and lints (65 files) pass.
