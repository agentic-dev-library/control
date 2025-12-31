# Migration Guide: agentic-triage to @agentic-dev-library/triage

This guide helps you migrate from the legacy `agentic-triage` CLI application to the new `@agentic-dev-library/triage` primitives library.

## Key Changes

1. **Package Name**: Renamed from `agentic-triage` to `@agentic-dev-library/triage`.
2. **Architecture**: Moved from a CLI-first application to a library of Vercel AI SDK primitives (tools, schemas, handlers).
3. **Dependencies**: Removed `agentic-control` dependency. Now standalone.

## Installation

```bash
# Before
npm install agentic-triage

# After
npm install @agentic-dev-library/triage
```

## Programmatic Usage

### Tools

Tools are now Vercel AI SDK compatible.

```typescript
import { getTriageTools } from '@agentic-dev-library/triage';
import { generateText } from 'ai';

const result = await generateText({
  model: myModel,
  tools: getTriageTools(),
  prompt: '...',
});
```

### Handlers

Handlers provide high-level entry points for common tasks.

```typescript
import { analyzeIssue } from '@agentic-dev-library/triage';

const result = await analyzeIssue(issueBody, myModel);
```

## CLI Usage

The CLI is still available via `npx @agentic-dev-library/triage`, but it's now a thin wrapper around the primitives.

```bash
# Before
agentic-triage assess 123

# After
npx @agentic-dev-library/triage assess 123
```
