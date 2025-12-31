/**
 * @agentic-dev-library/control
 *
 * Orchestration layer for AI agent fleet management consuming @agentic/triage primitives.
 *
 * Features:
 * - Multi-agent orchestration (Ollama/Jules/Cursor routing)
 * - CI resolution and PR lifecycle pipelines
 * - GitHub Marketplace actions integration
 * - Intelligent token switching (auto-selects org-appropriate tokens)
 * - Fleet management (spawn, monitor, coordinate agents)
 * - AI-powered triage (conversation analysis, code review)
 * - Station-to-station handoff (agent continuity)
 * - Token-aware GitHub operations
 *
 * @packageDocumentation
 */
export * from './actions/index.js';
export * from './core/index.js';
export * from './crews/index.js';
export { type CoordinationConfig, CursorAPI, type CursorAPIOptions, Fleet, type FleetConfig, } from './fleet/index.js';
export { cloneRepo, GitHubClient, isValidGitRef, isValidRepoFormat } from './github/index.js';
export { HandoffManager, type TakeoverOptions } from './handoff/index.js';
export * from './orchestrators/index.js';
export * from './pipelines/index.js';
export type { ContainerConfig, ContainerResult, SandboxOptions } from './sandbox/index.js';
export { ContainerManager, SandboxExecutor } from './sandbox/index.js';
export { AIAnalyzer, type AIAnalyzerOptions } from './triage/index.js';
export declare const VERSION: string;
//# sourceMappingURL=index.d.ts.map