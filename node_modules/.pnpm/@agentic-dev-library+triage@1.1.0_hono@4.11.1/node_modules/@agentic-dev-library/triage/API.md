# @agentic-dev-library/triage API Reference

Complete API reference for the triage primitives.

## Core Primitives

### TriageConnectors

Direct API for issue management across providers.

```typescript
import { TriageConnectors } from '@agentic-dev-library/triage';

const triage = new TriageConnectors({
  provider: 'github',
  github: { owner: 'myorg', repo: 'myrepo' }
});
```

#### Issues API

```typescript
// List issues
const issues = await triage.issues.list({
  status?: 'open' | 'in_progress' | 'blocked' | 'closed',
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'backlog',
  type?: 'bug' | 'feature' | 'task' | 'chore' | 'docs',
  labels?: string[],
  assignee?: string,
  limit?: number
});

// Get issue
const issue = await triage.issues.get('issue-id');

// Create issue
const newIssue = await triage.issues.create({
  title: string,
  body?: string,
  type?: 'bug' | 'feature' | 'task' | 'chore' | 'docs',
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'backlog',
  labels?: string[],
  assignee?: string
});

// Update issue
await triage.issues.update('issue-id', {
  title?: string,
  body?: string,
  status?: 'open' | 'in_progress' | 'blocked' | 'closed',
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'backlog',
  labels?: string[]
});

// Close issue
await triage.issues.close('issue-id', 'Resolved by PR #123');

// Search issues
const results = await triage.issues.search('query text', {
  status?: string,
  type?: string,
  limit?: number
});

// Add labels
await triage.issues.addLabels('issue-id', ['bug', 'priority:high']);

// Remove labels
await triage.issues.removeLabels('issue-id', ['wontfix']);
```

#### Projects API

```typescript
// List sprints
const sprints = await triage.projects.getSprints();

// Get current sprint
const current = await triage.projects.getCurrentSprint();

// Get ready work
const ready = await triage.projects.getReadyWork();

// Get issue statistics
const stats = await triage.projects.getIssueStats();
```

#### Reviews API

```typescript
// Get PR comments
const comments = await triage.reviews.getPRComments(123);
```

## Vercel AI SDK Tools

### getTriageTools()

Get all triage tools for use with Vercel AI SDK.

```typescript
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { getTriageTools } from '@agentic-dev-library/triage';

const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: getTriageTools(),
  prompt: 'Analyze our backlog and prioritize'
});
```

### getIssueTools()

Get only issue management tools.

```typescript
import { getIssueTools } from '@agentic-dev-library/triage';

const tools = getIssueTools();
// Returns: listIssuesTool, getIssueTool, createIssueTool, etc.
```

### getProjectTools()

Get only project management tools.

```typescript
import { getProjectTools } from '@agentic-dev-library/triage';

const tools = getProjectTools();
// Returns: listSprintsTool, getCurrentSprintTool, etc.
```

### getReviewTools()

Get only code review tools.

```typescript
import { getReviewTools } from '@agentic-dev-library/triage';

const tools = getReviewTools();
// Returns: getPRCommentsTool
```

### Individual Tools

```typescript
import {
  listIssuesTool,
  getIssueTool,
  createIssueTool,
  updateIssueTool,
  closeIssueTool,
  searchIssuesTool,
  addLabelsTool,
  removeLabelsTool
} from '@agentic-dev-library/triage';

// Use individual tools as needed
const minimalTools = {
  listIssues: listIssuesTool,
  createIssue: createIssueTool
};
```

## Providers

### Supported Providers

- **GitHub Issues** - GitHub-native projects
- **Beads** - Local-first issue tracking
- **Jira** - Enterprise project management
- **Linear** - Modern team workflows

### Provider Configuration

```typescript
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

// Jira
const jira = new TriageConnectors({
  provider: 'jira',
  jira: {
    host: 'mycompany.atlassian.net',
    email: 'user@example.com',
    apiToken: 'xxx'
  }
});

// Linear
const linear = new TriageConnectors({
  provider: 'linear',
  linear: { apiKey: 'lin_xxx' }
});
```

## Schemas

Zod schemas for type-safe validation.

```typescript
import { schemas } from '@agentic-dev-library/triage';

// Issue schemas
schemas.issueSchema
schemas.createIssueSchema
schemas.updateIssueSchema
schemas.listIssuesSchema

// PR schemas
schemas.prSchema
schemas.reviewSchema

// Triage schemas
schemas.triageResultSchema
```

## Handlers

Pre-built handlers for common workflows.

```typescript
import { handlers } from '@agentic-dev-library/triage';

// Analyze issue
const analysis = await handlers.analyzeIssue(issueBody, model);

// Review PR
const review = await handlers.reviewPR(prNumber, model);

// Triage workflow
const result = await handlers.triageIssue(issueData, model);
```

## Test Utilities

### Test Results Parsing

```typescript
import { parseTestReport, getFailedTests, getLowCoverageFiles } from '@agentic-dev-library/triage';

// Parse test results
const report = await parseTestReport('coverage/lcov.info');

// Get failed tests
const failed = getFailedTests(report);

// Get low coverage files
const lowCoverage = getLowCoverageFiles(report, 80); // threshold
```

### Reporters

```typescript
// Vitest reporter
import { ViTestReporter } from '@agentic-dev-library/triage/reporters/vitest';

// Playwright reporter
import { PlaywrightReporter } from '@agentic-dev-library/triage/reporters/playwright';
```

## GitHub Integration

Direct GitHub API utilities.

```typescript
import {
  getIssue,
  getPullRequest,
  addIssueComment,
  submitPRReview,
  getCheckRuns,
  getCodeScanningAlerts
} from '@agentic-dev-library/triage';

// Get issue
const issue = await getIssue(123);

// Get PR
const pr = await getPullRequest(456);

// Add comment
await addIssueComment(123, 'Thanks for reporting!');

// Submit review
await submitPRReview(456, {
  event: 'APPROVE',
  body: 'LGTM!'
});
```

## Scoring & Routing

Complexity evaluation and task routing.

```typescript
import { evaluateComplexity, TaskRouter, AgentRegistry } from '@agentic-dev-library/triage';

// Evaluate complexity
const score = await evaluateComplexity(evaluator, task, diff);
console.log(score.tier); // 'simple' | 'moderate' | 'complex' | 'critical'

// Route to agent
const registry = new AgentRegistry()
  .register(ollamaAgent)
  .register(julesAgent);

const router = new TaskRouter({ registry });
const result = await router.route(task, score);
```

## Queue Management

Priority queue with locking.

```typescript
import { QueueManager, MemoryStorage } from '@agentic-dev-library/triage';

const queue = new QueueManager(new MemoryStorage());

// Add item
await queue.add({
  id: 'task-1',
  priority: 1,
  status: 'pending'
});

// Get next item
const next = await queue.next();

// Lock item
await queue.lock('task-1', 60000); // 60s timeout

// Update item
await queue.update('task-1', { status: 'processing' });
```

## MCP (Model Context Protocol)

MCP server and clients for tool integration.

```typescript
import {
  createGitHubClient,
  createFilesystemClient,
  getGitHubTools,
  getFilesystemTools
} from '@agentic-dev-library/triage';

// Create clients
const github = await createGitHubClient();
const fs = await createFilesystemClient();

// Get tools
const githubTools = await getGitHubTools(github);
const fsTools = await getFilesystemTools(fs);
```

## Environment Variables

```bash
# GitHub
GH_TOKEN=ghp_xxx              # GitHub PAT

# AI
OLLAMA_API_KEY=xxx            # Ollama Cloud
ANTHROPIC_API_KEY=xxx         # Anthropic

# Jira
JIRA_HOST=xxx.atlassian.net
JIRA_EMAIL=user@example.com
JIRA_API_TOKEN=xxx

# Linear
LINEAR_API_KEY=lin_xxx
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  TriageIssue,
  IssuePriority,
  IssueStatus,
  IssueType,
  TriageProvider,
  ComplexityScore,
  AgentTask,
  QueueItem
} from '@agentic-dev-library/triage';
```

## Resources

- [GitHub Repository](https://github.com/agentic-dev-library/triage)
- [NPM Package](https://www.npmjs.com/package/@agentic-dev-library/triage)
- [Documentation](https://agentic-dev-library.github.io/triage/)
- [Examples](https://github.com/agentic-dev-library/triage/tree/main/examples)
