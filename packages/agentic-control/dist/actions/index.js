/**
 * GitHub Actions integration module
 *
 * Provides re-exports for use in GitHub Marketplace Actions:
 * - agentic-pr-review: AI-powered PR review
 * - agentic-ci-resolution: Automated CI failure resolution
 * - agentic-issue-triage: Intelligent issue triage
 * - agentic-orchestrator: Multi-agent coordination
 *
 * These exports are consumed by the composite actions in /actions directory
 */
export { addOrganization, getTokenForOrg, getTokenForRepo, safeSpawnSync, setTokenConfig, } from '../core/index.js';
export { CursorAPI, Fleet } from '../fleet/index.js';
// Re-export GitHub operations
export { cloneRepo, GitHubClient, isValidGitRef, isValidRepoFormat } from '../github/index.js';
// Re-export handoff protocols
export { HandoffManager } from '../handoff/index.js';
export { ContainerManager, SandboxExecutor } from '../sandbox/index.js';
// Re-export AI triage
export { AIAnalyzer } from '../triage/index.js';
//# sourceMappingURL=index.js.map