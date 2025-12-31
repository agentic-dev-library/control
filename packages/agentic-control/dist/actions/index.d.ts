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
export type { Agent, AgentStatus, Blocker, OrganizationConfig, SpawnOptions, TokenConfig, TriageResult, } from '../core/index.js';
export { addOrganization, getTokenForOrg, getTokenForRepo, safeSpawnSync, setTokenConfig, } from '../core/index.js';
export type { CoordinationConfig, FleetConfig } from '../fleet/index.js';
export { CursorAPI, type CursorAPIOptions, Fleet } from '../fleet/index.js';
export { cloneRepo, GitHubClient, isValidGitRef, isValidRepoFormat } from '../github/index.js';
export { HandoffManager, type TakeoverOptions } from '../handoff/index.js';
export type { ContainerConfig, ContainerResult, SandboxOptions } from '../sandbox/index.js';
export { ContainerManager, SandboxExecutor } from '../sandbox/index.js';
export { AIAnalyzer, type AIAnalyzerOptions } from '../triage/index.js';
//# sourceMappingURL=index.d.ts.map