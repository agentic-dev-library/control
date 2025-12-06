# Tech Stack

## TypeScript/Node.js

### Core Technologies
- **Runtime**: Node.js >=20.0.0
- **Language**: TypeScript 5.7+ with strict mode
- **Module System**: ES Modules (type: "module")
- **Package Manager**: pnpm (preferred)

### Key Dependencies
- `commander` - CLI framework
- `@octokit/rest` - GitHub API client
- `ai` + `@ai-sdk/*` - Vercel AI SDK with pluggable providers
- `@modelcontextprotocol/sdk` - MCP integration
- `cosmiconfig` - Configuration management
- `zod` - Runtime type validation
- `simple-git` - Git operations

### Build & Development
```bash
# Install
pnpm install

# Development (watch mode)
pnpm run dev

# Build
pnpm run build

# Test
pnpm test

# Format
pnpm run format

# Lint
pnpm run lint

# Type check
pnpm run typecheck

# Run CLI from source
pnpm run agentic
```

### TypeScript Configuration
- Target: ES2022
- Module: NodeNext
- Strict mode enabled
- Declaration files generated
- Source maps enabled

## Python

### Core Technologies
- **Runtime**: Python >=3.11
- **Package Manager**: uv (modern Python package manager)
- **Framework**: CrewAI 1.5.0+ with Anthropic integration

### Key Dependencies
- `crewai[tools,anthropic]` - CrewAI framework
- `pyyaml` - YAML parsing
- `pydantic` - Data validation
- `vendor-connectors[meshy]` - 3D asset generation
- `mcp` - Model Context Protocol (optional)

### Build & Development
```bash
cd python

# Install dependencies
uv sync --extra tests

# Run tests
uv run pytest tests/ -v

# Run a crew
uv run crew-agents run <crew-name>

# Start MCP server
uv run crew-mcp

# Lint and format
uvx ruff check --fix src/ tests/
uvx ruff format src/ tests/
```

### Python Configuration
- Line length: 100
- Target: Python 3.11+
- Linter: ruff
- Test framework: pytest

## Common Commands

### TypeScript
- `pnpm run agentic` - Run CLI from source
- `pnpm run build` - Compile TypeScript
- `pnpm test` - Run tests with vitest
- `pnpm run format` - Format with Prettier

### Python
- `uv run crew-agents` - Run crew CLI
- `uv run pytest` - Run tests
- `uvx ruff check` - Lint code
- `uvx ruff format` - Format code

## Environment Variables

### Required for TypeScript
- `GITHUB_TOKEN` - Default GitHub token
- `GITHUB_<ORG>_TOKEN` - Org-specific tokens
- `CURSOR_API_KEY` - For fleet management
- AI provider keys: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.

### Required for Python
- `ANTHROPIC_API_KEY` - For CrewAI agents
- `MESHY_API_KEY` - For 3D asset generation (optional)

## Configuration Files

### TypeScript
- `agentic.config.json` - Main configuration (cosmiconfig)
- `tsconfig.json` - TypeScript compiler options
- `package.json` - Dependencies and scripts

### Python
- `pyproject.toml` - Project metadata and dependencies
- `crewbase.yaml` - CrewAI configuration
- `.crewai/manifest.yaml` - Package crew definitions
