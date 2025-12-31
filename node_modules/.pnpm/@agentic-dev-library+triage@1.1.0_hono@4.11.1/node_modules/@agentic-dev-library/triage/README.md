# @agentic-dev-library/triage

[![npm version](https://img.shields.io/npm/v/@agentic-dev-library/triage.svg)](https://www.npmjs.com/package/@agentic-dev-library/triage)
[![Coverage Status](https://coveralls.io/repos/github/agentic-dev-library/triage/badge.svg?branch=main)](https://coveralls.io/github/agentic-dev-library/triage?branch=main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🏢 Enterprise Context

**Agentic** is the AI & Agents division of the [jbcom enterprise](https://jbcom.github.io). This package is part of a coherent suite of specialized tools, sharing a unified design system and interconnected with sibling organizations like [Strata](https://strata.game) and [Extended Data](https://extendeddata.dev).

> Portable triage primitives for AI agents - Vercel AI SDK tools, MCP server, and direct API

**@agentic-dev-library/triage** provides reusable triage primitives for AI agent systems. It offers three integration patterns:

1. **Vercel AI SDK Tools** - Portable tools for any Vercel AI SDK application
2. **MCP Server** - Model Context Protocol server for Claude Desktop, Cursor, etc.
3. **Direct TypeScript API** - Programmatic access for non-AI use cases

## 🚨 Migration from agentic-triage

This package was previously published as `agentic-triage` and `@agentic/triage`. Starting with v0.3.0, it has been consolidated as `@agentic-dev-library/triage` under the [agentic-dev-library](https://www.npmjs.com/org/agentic-dev-library) NPM organization.

To migrate from older versions:
1. Update your `package.json` to use `@agentic-dev-library/triage`.
2. Update your imports:
   ```typescript
   // Old (if using previous package names)
   import { getTriageTools } from 'agentic-triage';
   // New
   import { getTriageTools } from '@agentic-dev-library/triage';
   ```

## Installation

```bash
# npm
npm install @agentic-dev-library/triage

# pnpm
pnpm add @agentic-dev-library/triage
```

## Quick Start

### 1. Vercel AI SDK Tools (Recommended for AI Agents)

```typescript
import { getTriageTools } from '@agentic-dev-library/triage';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: getTriageTools(),
  prompt: 'List all open high-priority bugs and create a triage plan',
});
```

#### Selective Tool Import

```typescript
import { getIssueTools, getReviewTools, getProjectTools } from '@agentic-dev-library/triage';

// Only import what your agent needs
const myAgentTools = {
  ...getIssueTools(),    // Issue CRUD, search, labels
  ...getReviewTools(),   // PR review, comments, approval
};
```

#### Individual Tools

```typescript
import {
  listIssuesTool,
  createIssueTool,
  getIssueTool,
  updateIssueTool,
  closeIssueTool,
  searchIssuesTool,
  addLabelsTool,
  removeLabelsTool,
} from '@agentic-dev-library/triage';

// Use individual tools
const tools = { listIssues: listIssuesTool, createIssue: createIssueTool };
```

### 2. MCP Server (For Claude Desktop, Cursor, etc.)

```json
{
  "mcpServers": {
    "triage": {
      "command": "npx",
      "args": ["@agentic-dev-library/triage", "mcp-server"]
    }
  }
}
```

### 3. Direct TypeScript API

```typescript
import { TriageConnectors } from '@agentic-dev-library/triage';

const triage = new TriageConnectors({ provider: 'github' });

// Issue operations
const issues = await triage.issues.list({ status: 'open', priority: 'high' });
const issue = await triage.issues.create({
  title: 'Fix login bug',
  body: 'Users cannot login with SSO',
  type: 'bug',
  priority: 'critical',
});
await triage.issues.addLabels(issue.id, ['needs-triage', 'auth']);
await triage.issues.close(issue.id, 'Fixed in PR #123');

// Project operations
const sprints = await triage.projects.getSprints();
const currentSprint = await triage.projects.getCurrentSprint();

// Review operations
const comments = await triage.reviews.getPRComments(144);
```

## Provider Support

| Provider | Status | Use Case |
|----------|--------|----------|
| **GitHub Issues** | ✅ Complete | GitHub-native projects |
| **Beads** | ✅ Complete | Local-first, AI-native issue tracking |
| **Jira** | ✅ Complete | Enterprise projects |
| **Linear** | ✅ Complete | Modern team workflows |

### Auto-Detection

The provider is auto-detected based on environment:
- `.beads/` directory present → Beads provider
- `GITHUB_REPOSITORY` set or `.git` remote → GitHub provider

### Explicit Configuration

```typescript
import { TriageConnectors } from '@agentic-dev-library/triage';

// GitHub
const github = new TriageConnectors({
  provider: 'github',
  github: { owner: 'myorg', repo: 'myrepo' }
});

// Beads
const beads = new TriageConnectors({
  provider: 'beads',
  beads: { workingDir: '/path/to/project' }
});
```

## CLI (Development & Testing)

The CLI is primarily for development and testing the primitives:

```bash
# Test issue assessment
triage assess 123

# Test PR review
triage review 144
```

## Environment Variables

```bash
# For GitHub provider
GH_TOKEN=ghp_xxx              # GitHub PAT with repo scope

# For AI operations (when using CLI)
OLLAMA_API_KEY=xxx            # Ollama Cloud API key
ANTHROPIC_API_KEY=xxx         # Or Anthropic API key
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Build
pnpm run build

# Lint
pnpm run check
```

## License

MIT
