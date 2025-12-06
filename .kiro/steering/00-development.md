# agentic-control Development Guidelines

## Overview

agentic-control is a dual-language package:
- **Node.js**: AI agent fleet management, triage, GitHub integration
- **Python**: CrewAI engine for autonomous development crews

## Node.js Development

```bash
# Install dependencies
pnpm install

# Development
pnpm run dev

# Build
pnpm run build

# Test
pnpm run test

# CLI
pnpm run agentic
```

## Python Development (CrewAI)

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
```

## Commit Messages

Use conventional commits:
- `feat(node): description` → Node.js feature
- `feat(python): description` → Python feature
- `fix(scope): description` → patch bump

## Quality Standards

- ✅ All tests passing (both Node.js and Python)
- ✅ TypeScript: no errors, proper types
- ✅ Python: ruff clean, type hints
- ❌ No TODOs or placeholders
