# Agent Integration Guide

This document describes how to integrate @agentic-dev-library/triage tools into your AI agent system.

## Overview

@agentic-dev-library/triage provides **portable triage primitives** for AI agents. These are Vercel AI SDK-compatible tools that can be used with any model provider (Anthropic, OpenAI, Ollama, etc.).

## Tool Categories

### Issue Tools (`getIssueTools()`)

| Tool | Description |
|------|-------------|
| `listIssues` | List issues with filters (status, priority, type, labels) |
| `getIssue` | Get detailed issue by ID |
| `createIssue` | Create a new issue |
| `updateIssue` | Update issue fields |
| `closeIssue` | Close issue with reason |
| `searchIssues` | Full-text search across issues |
| `addLabels` | Add labels to an issue |
| `removeLabels` | Remove labels from an issue |

### Project Tools (`getProjectTools()`)

| Tool | Description |
|------|-------------|
| `listSprints` | List all sprints |
| `getCurrentSprint` | Get the current active sprint |
| `getReadyWork` | Get work items ready to start |
| `getIssueStats` | Get issue statistics |

### Review Tools (`getReviewTools()`)

| Tool | Description |
|------|-------------|
| `getPRComments` | Get comments on a PR |

## Integration Examples

### Basic Agent Setup

```typescript
import { getTriageTools } from '@agentic-dev-library/triage';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

async function runTriageAgent(prompt: string) {
  const result = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    tools: getTriageTools(),
    maxSteps: 10,
    prompt,
  });
  
  return result.text;
}

// Example usage
await runTriageAgent('Find all critical bugs and create a triage plan');
```

### Selective Tool Import

```typescript
import { 
  listIssuesTool, 
  createIssueTool,
  searchIssuesTool 
} from '@agentic-dev-library/triage';

// Only give agent the tools it needs
const minimalTools = {
  listIssues: listIssuesTool,
  createIssue: createIssueTool,
  searchIssues: searchIssuesTool,
};
```

### Custom Provider Configuration

```typescript
import { setTriageConnectors, TriageConnectors } from '@agentic-dev-library/triage';
import { getTriageTools } from '@agentic-dev-library/triage';

// Configure before using tools
const connectors = new TriageConnectors({
  provider: 'github',
  github: { owner: 'myorg', repo: 'myrepo' }
});
setTriageConnectors(connectors);

// Now tools will use this configuration
const tools = getTriageTools();
```

## Tool Schemas

All tools use Zod schemas for type-safe parameters. Here's an example:

### listIssues

```typescript
{
  description: 'List issues from the issue tracker with optional filters',
  parameters: {
    status: z.enum(['open', 'in_progress', 'blocked', 'closed']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low', 'backlog']).optional(),
    type: z.enum(['bug', 'feature', 'task', 'chore', 'docs']).optional(),
    labels: z.array(z.string()).optional(),
    limit: z.number().optional().default(50),
    assignee: z.string().optional(),
  }
}
```

### createIssue

```typescript
{
  description: 'Create a new issue in the issue tracker',
  parameters: {
    title: z.string().describe('Issue title'),
    body: z.string().optional().describe('Issue description'),
    type: z.enum(['bug', 'feature', 'task', 'chore', 'docs']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low', 'backlog']).optional(),
    labels: z.array(z.string()).optional(),
    assignee: z.string().optional(),
  }
}
```

## Provider-Specific Notes

### GitHub

- Uses GitHub Issues API
- Requires `GH_TOKEN` environment variable
- Labels map directly to GitHub labels
- Priority is stored as a label (e.g., `priority:high`)

### Beads

- Uses local `.beads/` directory
- No authentication required
- Native support for priorities, types, and relationships
- Supports blocking/blocked-by relationships

## Error Handling

Tools return structured errors that agents can understand:

```typescript
// Success
{ issues: [...], count: 10 }

// Error
{ error: 'Issue not found', code: 'NOT_FOUND' }
```

## Best Practices

1. **Use selective imports** - Only give agents the tools they need
2. **Configure providers early** - Set up connectors before tool usage
3. **Handle errors gracefully** - Tools may fail, design prompts accordingly
4. **Limit tool steps** - Use `maxSteps` to prevent infinite loops
5. **Log tool calls** - Monitor what tools agents are using

## Sigma-Weighted Scoring System

The scoring module provides provider-agnostic complexity evaluation:

### Key Components

| Module | Purpose |
|--------|---------|
| `scoring/weights.ts` | Dimension weights and tier thresholds |
| `scoring/evaluator.ts` | LLM-agnostic complexity evaluation |
| `scoring/agents.ts` | Agent registry interfaces (no implementations) |
| `scoring/router.ts` | Intelligent task routing |
| `queue/manager.ts` | Priority queue with locking |
| `queue/storage.ts` | Storage interface + MemoryStorage |

### Usage

```typescript
import { 
  evaluateComplexity, 
  AgentRegistry, 
  TaskRouter 
} from '@agentic-dev-library/triage';

// Provide your own LLM evaluator
const evaluate = async (prompt: string) => {
  // Call Ollama, OpenAI, Anthropic, etc.
  return response;
};

// Evaluate complexity
const score = await evaluateComplexity(evaluate, 'Fix the bug', diff);
console.log(score.tier);     // 'simple'
console.log(score.weighted); // 3.5

// Set up agents (implementations from @agentic/providers)
const registry = new AgentRegistry()
  .register(myOllamaAgent)
  .register(myJulesAgent);

// Route tasks
const router = new TaskRouter({ registry });
const result = await router.route(task, score);
```

### The Algorithm

Tasks scored across 8 dimensions (0-10 each):
- `files_changed` (0.15) - Number of files
- `lines_changed` (0.10) - Volume of changes
- `dependency_depth` (0.15) - Import chain depth
- `test_coverage_need` (0.10) - Testing complexity
- `cross_module_impact` (0.15) - System-wide effects
- `semantic_complexity` (0.20) - Logic difficulty
- `context_required` (0.10) - Codebase knowledge
- `risk_level` (0.05) - Breaking change risk

Weighted score → tier → agent routing.

## Related

- [README.md](./README.md) - Main documentation

---

## Agent Autonomy Policy

### YOU HAVE FULL AUTONOMY

When assigned to a PR or issue, you are **explicitly authorized** to:

1. **PUSH** - `git push` and `git push --force-with-lease` to update PRs
2. **REBASE** - Rebase onto main/master to resolve conflicts
3. **FIX** - Make any changes needed to pass CI checks
4. **MERGE** - Merge PRs using squash merge when CI is green
5. **CREATE** - Create new branches, files, and PRs as needed

### DO NOT ASK FOR PERMISSION

- You do NOT need to ask before pushing
- You do NOT need to ask before merging
- You do NOT need to ask before force-pushing
- Execute immediately when given instructions

When you see `@cursor` or `@jules` followed by instructions, execute them immediately.
This means: Do it now. Don't ask. You have permission.
