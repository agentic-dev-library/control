/**
 * CI/CD pipeline orchestration module
 *
 * Provides workflows for:
 * - CI resolution: Automated fixing of failing CI/CD pipelines
 * - PR lifecycle: Pull request creation, review, and management
 * - Issue triage: Automated issue analysis and routing
 *
 * Re-exports GitHub, triage, and handoff capabilities for pipeline automation
 */
export { cloneRepo, GitHubClient, isValidGitRef, isValidRepoFormat } from '../github/index.js';
export { HandoffManager, type TakeoverOptions } from '../handoff/index.js';
export type { ContainerConfig, ContainerResult, SandboxOptions } from '../sandbox/index.js';
export { ContainerManager, SandboxExecutor } from '../sandbox/index.js';
export { AIAnalyzer, type AIAnalyzerOptions } from '../triage/index.js';
//# sourceMappingURL=index.d.ts.map