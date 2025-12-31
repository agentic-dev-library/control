# @agentic/triage

[![npm version](https://img.shields.io/npm/v/@agentic/triage.svg)](https://www.npmjs.com/package/@agentic/triage)
[![Coverage Status](https://coveralls.io/repos/github/jbdevprimary/@agentic/triage/badge.svg?branch=main)](https://coveralls.io/github/jbdevprimary/@agentic/triage?branch=main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Portable triage primitives for AI agents - Vercel AI SDK tools, MCP server, and direct API

**@agentic/triage** provides reusable triage primitives for AI agent systems. It offers three integration patterns:

1. **Vercel AI SDK Tools** - Portable tools for any Vercel AI SDK application
2. **MCP Server** - Model Context Protocol server for Claude Desktop, Cursor, etc.
3. **Direct TypeScript API** - Programmatic access for non-AI use cases

## Installation

```bash
# npm
npm install @agentic/triage

# pnpm
pnpm add @agentic/triage
```

## Quick Start

### 1. Vercel AI SDK Tools (Recommended for AI Agents)

```typescript
import { getTriageTools } from '@agentic/triage';
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
import { getIssueTools, getReviewTools, getProjectTools } from '@agentic/triage';

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
} from '@agentic/triage';

// Use individual tools
const tools = { listIssues: listIssuesTool, createIssue: createIssueTool };
```

### 2. MCP Server (For Claude Desktop, Cursor, etc.)

```json
{
  "mcpServers": {
    "triage": {
      "command": "npx",
      "args": ["@agentic/triage", "mcp-server"]
    }
  }
}
```

### 3. Direct TypeScript API

```typescript
import { TriageConnectors } from '@agentic/triage';

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

// Project operations (coming soon)
const sprints = await triage.projects.listSprints();
const currentSprint = await triage.projects.getCurrentSprint();

// Review operations (coming soon)
const comments = await triage.reviews.getPRComments(144);
```

## Provider Support

| Provider | Status | Use Case |
|----------|--------|----------|
| **GitHub Issues** | ✅ Complete | GitHub-native projects |
| **Beads** | ✅ Complete | Local-first, AI-native issue tracking |
| **Jira** | 🔜 Planned | Enterprise projects |
| **Linear** | 🔜 Planned | Modern team workflows |

### Auto-Detection

The provider is auto-detected based on environment:
- `.beads/` directory present → Beads provider
- `GITHUB_REPOSITORY` set or `.git` remote → GitHub provider

### Explicit Configuration

```typescript
import { TriageConnectors } from '@agentic/triage';

// GitHub
const github = new TriageConnectors({
  provider: 'github',
  github: { owner: 'myorg', repo: 'myrepo' }
});

// Beads
const beads = new TriageConnectors({
  provider: 'beads',
  beads: { rootDir: '/path/to/project' }
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      @agentic/triage                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ GitHub      │  │ Beads       │  │ Jira/Linear         │ │
│  │ Provider    │  │ Provider    │  │ (coming soon)       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         └────────────────┼────────────────────┘            │
│                          ▼                                  │
│              ┌───────────────────────┐                     │
│              │   TriageConnectors    │                     │
│              │   (Unified API)       │                     │
│              └───────────┬───────────┘                     │
│                          │                                  │
│         ┌────────────────┼────────────────┐                │
│         ▼                ▼                ▼                │
│  ┌────────────┐  ┌─────────────┐  ┌────────────┐          │
│  │ Vercel AI  │  │ MCP Server  │  │ Direct API │          │
│  │ SDK Tools  │  │             │  │            │          │
│  └─────┬──────┘  └──────┬──────┘  └─────┬──────┘          │
│        │                │               │                  │
└────────┼────────────────┼───────────────┼──────────────────┘
         │                │               │
         ▼                ▼               ▼
    AI Agents        MCP Clients     Applications
    (Structured      (Claude,         (Scripts,
     Outputs)         Cursor)          Services)
```

## Consumers

- Any Vercel AI SDK application
- Any MCP-compatible client (Claude Desktop, Cursor, etc.)
- Direct TypeScript/JavaScript applications

## CLI (Development & Testing)

The CLI is primarily for development and testing the primitives:

```bash
# Test issue assessment
npx @agentic/triage assess 123

# Test PR review
npx @agentic/triage review 144

# Start MCP server
npx @agentic/triage mcp-server
```

## Environment Variables

```bash
# For GitHub provider
GH_TOKEN=ghp_xxx              # GitHub PAT with repo scope

# For Beads provider (optional)
BEADS_ROOT=/path/to/project   # Beads project root

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

## Related Projects

- [Beads](https://github.com/steveyegge/beads) - Local-first, AI-native issue tracking
- [Vercel AI SDK](https://sdk.vercel.ai) - AI SDK for TypeScript

## License

See [CHANGELOG.md](./CHANGELOG.md) for a full history of changes.

MIT
