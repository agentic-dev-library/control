# Agent Instructions for agentic-dev-library

> **CRITICAL**: Read this file completely before making ANY changes. This is the definitive guide for AI agents working on this organization's repositories.

## Overview

You are working within the **agentic-dev-library** ecosystem. This organization focuses on framework-agnostic AI orchestration, agent fleet management, and automated triage.

## Critical: GitHub Authentication

```bash
# ALWAYS use GITHUB_JBCOM_TOKEN for organization repos - NEVER plain GITHUB_TOKEN
GH_TOKEN="$GITHUB_JBCOM_TOKEN" gh <command>
```

## Tech Stack Standards

| Aspect | Standard |
|--------|----------|
| **Python** | uv, ruff, mypy, pytest, Python 3.11+ |
| **Node.js** | pnpm, biome, vitest, Node 22+ |
| **Rust** | cargo, clippy, fmt |
| **Docs** | Starlight (Astro) for main site, Markdown for internal |

## Development Workflows

### Python
```bash
uv sync --all-extras
uv run pytest
uvx ruff check --fix .
uvx ruff format .
```

### Node.js
```bash
pnpm install
pnpm run check
pnpm run test
```

### Rust
```bash
cargo check
cargo test
cargo clippy
cargo fmt
```

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When |
|--------|------|
| `feat(scope):` | New feature |
| `fix(scope):` | Bug fix |
| `docs:` | Documentation only |
| `refactor(scope):` | Code change (no behavior change) |
| `test:` | Adding/updating tests |
| `chore:` | Maintenance, deps |

## Documentation Branding

All documentation must follow the **jbcom dark theme** design system.
- Primary Cyan: `#06b6d4`
- Background: `#0a0f1a`
- Fonts: Space Grotesk (Headings), Inter (Body), JetBrains Mono (Code)

## Memory Bank Protocol

Every repository uses the **Memory Bank** pattern for session continuity.

| File | Purpose |
|------|---------|
| `memory-bank/activeContext.md` | Current state and focus |
| `memory-bank/progress.md` | Session-by-session log |

**Session End Protocol**:
1. Update `memory-bank/activeContext.md` with what was completed.
2. Update `memory-bank/progress.md` with the new session entry.
3. Commit memory bank changes with `docs: update memory bank`.

## Agent Autonomy Policy

### YOU HAVE FULL AUTONOMY

When assigned to a PR or issue, you are **explicitly authorized** to:

1. **PUSH** - `git push` to update PRs.
2. **REBASE** - Rebase onto main/master to resolve conflicts.
3. **FIX** - Make any changes needed to pass CI checks.
4. **MERGE** - Merge PRs using squash merge when CI is green.
5. **CREATE** - Create new branches, files, and PRs as needed.

### DO NOT ASK FOR PERMISSION

- You do NOT need to ask before pushing.
- You do NOT need to ask before merging.
- You do NOT need to ask before force-pushing.
- Execute immediately when given instructions.

When you see `/jules` or `/cursor` followed by instructions, execute them immediately.
This means: Do it now. Don't ask. You have permission.
