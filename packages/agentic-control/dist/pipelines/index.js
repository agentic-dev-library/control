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
// Re-export GitHub operations for PR/issue management
export { cloneRepo, GitHubClient, isValidGitRef, isValidRepoFormat } from '../github/index.js';
// Re-export handoff for agent continuity in pipelines
export { HandoffManager } from '../handoff/index.js';
export { ContainerManager, SandboxExecutor } from '../sandbox/index.js';
// Re-export AI triage for code review and analysis
export { AIAnalyzer } from '../triage/index.js';
//# sourceMappingURL=index.js.map