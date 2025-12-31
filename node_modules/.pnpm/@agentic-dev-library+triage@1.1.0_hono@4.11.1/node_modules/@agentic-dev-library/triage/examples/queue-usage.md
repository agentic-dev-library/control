# Queue Manager Usage Examples

This guide demonstrates how to use the queue management primitives with different storage backends.

## Basic Usage with Memory Storage

```typescript
import { QueueManager, MemoryStorage, PriorityScorer } from '@agentic/triage';

// Create a queue with memory storage
const storage = new MemoryStorage();
const queue = new QueueManager(storage);

// Add items to the queue
await queue.add({
    id: 'org/repo#123',
    priority: 1,
    metadata: { author: 'alice', labels: ['critical'] },
});

// Get the next item to process
const item = await queue.next();

// Process with automatic locking
await queue.processNext(async (item) => {
    console.log(`Processing ${item.id}`);
    // Your processing logic here
    return { success: true };
});
```

## File Storage for Local Testing

```typescript
import { QueueManager, FileStorage } from '@agentic/triage';

// Create a queue with file storage
const storage = new FileStorage('/tmp/queue-state.json');
const queue = new QueueManager(storage, {
    lockTimeout: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
});

// Add items
await queue.add({
    id: 'org/repo#456',
    priority: 2,
    metadata: { type: 'feature' },
});

// List all pending items
const pending = await queue.list('pending');
console.log(`Pending items: ${pending.length}`);
```

## GitHub Issue Storage (Production)

```typescript
import { QueueManager, GitHubIssueStorage } from '@agentic/triage';

// Create storage backed by a GitHub Issue
const storage = new GitHubIssueStorage({
    repo: 'owner/repo',
    issueNumber: 123, // or 'auto' to create
    issueTitle: 'Merge Queue State',
    token: process.env.GITHUB_TOKEN!,
});

const queue = new QueueManager(storage);

// The queue state is persisted in the GitHub Issue
// and uses issue comments for distributed locking
```

## Priority Scoring

```typescript
import { PriorityScorer } from '@agentic/triage';

const scorer = new PriorityScorer();

// Score based on labels
const priority1 = scorer.score({
    labels: ['critical', 'security'],
}); // Returns 1 (critical)

// Score based on type
const priority2 = scorer.score({
    type: 'security',
}); // Returns 1 (critical)

// Score based on metadata
const priority3 = scorer.score({
    type: 'feature',
    age: 10, // days old
    reviewCount: 3,
    labels: ['high'],
}); // Returns 1 (boosted to critical)

// Score draft PR
const priority4 = scorer.score({
    type: 'feature',
    isDraft: true,
}); // Returns 3 (low)
```

## Distributed Locking

```typescript
import { LockManager, MemoryStorage } from '@agentic/triage';

const storage = new MemoryStorage();
const lockManager = new LockManager(storage);

// Execute with automatic lock management
await lockManager.withLock('worker-1', async () => {
    // Your critical section here
    console.log('Processing with exclusive lock');
});

// Try to acquire lock (returns null if unavailable)
const result = await lockManager.tryWithLock('worker-2', async () => {
    return 'success';
});

if (result === null) {
    console.log('Could not acquire lock, another worker is processing');
}

// Wait for lock to be released
const released = await lockManager.waitForRelease(30000); // 30 second timeout
if (released) {
    console.log('Lock released, can proceed');
}
```

## Complete Merge Queue Example

```typescript
import {
    QueueManager,
    GitHubIssueStorage,
    PriorityScorer,
    LockManager,
} from '@agentic/triage';

// Setup
const storage = new GitHubIssueStorage({
    repo: 'my-org/my-repo',
    issueNumber: 'auto',
    token: process.env.GITHUB_TOKEN!,
});

const queue = new QueueManager(storage, {
    lockTimeout: 10 * 60 * 1000, // 10 minutes
    maxRetries: 3,
});

const scorer = new PriorityScorer();
const lockManager = new LockManager(storage);

// Add PR to queue with priority
async function enqueuePR(pr: {
    id: string;
    labels: string[];
    type: string;
    age: number;
}) {
    const priority = scorer.score({
        labels: pr.labels,
        type: pr.type as any,
        age: pr.age,
    });

    await queue.add({
        id: pr.id,
        priority,
        metadata: pr,
    });

    console.log(`Added ${pr.id} with priority ${priority}`);
}

// Process queue
async function processQueue() {
    const result = await queue.processNext(async (item) => {
        console.log(`Processing ${item.id}...`);
        
        // Merge logic here
        // await mergePR(item.id);
        
        return { success: true };
    });

    if (result === null) {
        console.log('Queue is empty or locked');
    } else {
        console.log(`Successfully processed ${result.item.id}`);
    }
}

// Worker loop
async function worker() {
    while (true) {
        try {
            await processQueue();
        } catch (error) {
            console.error('Worker error:', error);
        }
        
        // Wait before next iteration
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

// Start worker
worker();
```

## Queue Statistics

```typescript
// Get queue statistics
const stats = await queue.stats();
console.log(`Total items: ${stats.total}`);
console.log(`Pending: ${stats.byStatus.pending}`);
console.log(`Processing: ${stats.byStatus.processing}`);
console.log(`Failed: ${stats.byStatus.failed}`);
console.log(`Completed (24h): ${stats.completed24h}`);

// Get queue length
const length = await queue.length();
console.log(`Queue length: ${length}`);

// List all items
const allItems = await queue.list();
for (const item of allItems) {
    console.log(`${item.id}: ${item.status} (priority: ${item.priority})`);
}
```

## Error Handling

```typescript
// Handle failures with automatic retry
await queue.processNext(async (item) => {
    try {
        // Process item
        await riskyOperation(item);
        return { success: true };
    } catch (error) {
        // Will be retried up to maxRetries times
        throw error;
    }
});

// Manually fail an item
await queue.fail('org/repo#123', 'Merge conflict detected');

// Cancel an item
await queue.cancel('org/repo#456');

// Get item details
const item = await queue.get('org/repo#789');
if (item) {
    console.log(`Status: ${item.status}`);
    console.log(`Retries: ${item.retries}`);
    console.log(`Last error: ${item.lastError}`);
}
```

## Multi-Organization Queue

```typescript
// Single queue for multiple organizations
const storage = new GitHubIssueStorage({
    repo: 'shared-org/merge-queue',
    issueNumber: 1,
    token: process.env.GITHUB_TOKEN!,
});

const queue = new QueueManager(storage);

// Add PRs from different organizations
await queue.add({
    id: 'org-1/repo-a#123',
    priority: 1,
});

await queue.add({
    id: 'org-2/repo-b#456',
    priority: 2,
});

// Process in priority order
await queue.processNext(async (item) => {
    const [org, repo, pr] = item.id.split(/[/#]/);
    console.log(`Processing PR #${pr} from ${org}/${repo}`);
});
```
