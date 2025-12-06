# Agent Instructions for agentic-control

## Before Starting

Check active context for current work:
```bash
cat memory-bank/activeContext.md
```

## Development Commands

See `.kiro/steering/tech.md` for complete build/test/lint commands.

Quick reference:
- **TypeScript**: `pnpm install`, `pnpm run build`, `pnpm test`
- **Python**: `cd python && uv sync --extra tests && uv run pytest`

## MCP Servers

```bash
# Start TypeScript MCP server
npx agentic mcp

# Start Python CrewAI MCP server  
crew-mcp
```

## Commit Conventions

Use conventional commits with module scopes:
- `feat(fleet): description` → minor version bump
- `feat(crew): description` → minor version bump
- `fix(triage): description` → patch version bump
- `docs: description` → no version bump

**Scopes**: `fleet`, `crew`, `triage`, `github`, `handoff`, `core`

## Project Structure

See `.kiro/steering/structure.md` and `.kiro/steering/product.md` for architecture details.
