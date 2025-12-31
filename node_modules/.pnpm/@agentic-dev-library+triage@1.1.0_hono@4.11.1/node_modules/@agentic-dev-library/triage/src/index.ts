/**
 * @agentic-dev-library/triage - AI-Powered Development Automation
 *
 * The triage package provides a comprehensive SDK for automating
 * the entire development lifecycle:
 *
 * - **Issue Triage**: AI-powered assessment, labeling, and planning
 * - **Code Review**: AI-driven PR reviews and feedback handling
 * - **Sprint Planning**: Weighted prioritization, backlog balancing
 *
 * @example SDK Usage
 * ```typescript
 * import { aiGenerate, getTriageTools } from '@agentic-dev-library/triage';
 *
 * // Generate with AI
 * const result = await aiGenerate(prompt, { systemPrompt });
 * ```
 *
 * @packageDocumentation
 * @module @agentic-dev-library/triage
 */

// ============================================================================
// AI SDK Primitives (Schemas, Tools, Handlers)
// ============================================================================

export * as handlers from './handlers/index.js';
export * as schemas from './schemas/index.js';
export * as tools from './tools/index.js';

// ============================================================================
// AI Integration
// ============================================================================

/**
 * AI generation with Vercel AI SDK + Ollama Cloud
 */
export {
    type AIConfig,
    CLOUD_HOST,
    DEFAULT_MODEL,
    type GenerateOptions as AIGenerateOptions,
    generate as aiGenerate,
    generateWithTools,
    getModel,
    getProvider,
} from './ai.js';

// ============================================================================
// Model Context Protocol (MCP)
// ============================================================================

export {
    type AgenticTaskOptions,
    type AgenticTaskResult,
    CONTEXT7_TOOLS,
    closeMCPClients,
    createContext7Client,
    createFilesystemClient,
    createGitHubClient,
    createInlineFilesystemClient,
    createViteReactClient,
    FILESYSTEM_TOOLS,
    getAllTools,
    getContext7Tools,
    getFilesystemTools,
    getGitHubTools,
    getViteReactTools,
    initializeMCPClients,
    type MCPClient,
    type MCPClientOptions,
    type MCPClients,
    runAgenticTask,
    VITE_REACT_TOOLS,
} from './mcp.js';

export { createPlaywrightClient, getPlaywrightTools, PLAYWRIGHT_TOOLS, type PlaywrightOptions } from './playwright.js';

// ============================================================================
// GitHub (MCP)
// ============================================================================

export {
    addIssueComment,
    addIssueLabels,
    areAllChecksPassing,
    type CheckRun,
    type CodeScanningAlert,
    commentOnPR,
    convertPRToDraft,
    createCheckRun,
    createIssueComment,
    type DependabotAlert,
    disableAutoMerge,
    enableAutoMerge,
    formatAlertsForAI,
    getCheckRuns,
    getCodeScanningAlerts,
    getDependabotAlerts,
    getIssue,
    getPRCodeScanningAlerts,
    getPRReviewComments,
    getPRReviews,
    getPullRequest,
    getRepoContext,
    markPRReadyForReview,
    type ReviewComment,
    replyToReviewComment,
    submitPRReview,
    waitForChecks,
} from './octokit.js';

// ============================================================================
// Test Results
// ============================================================================

export {
    type CoverageData,
    type FileCoverage,
    formatForAI,
    getFailedTests,
    getLowCoverageFiles,
    getTestsByFile,
    getUncoveredFunctions,
    parseTestReport,
    type TestError,
    type TestFile,
    type TestReport,
    type TestResult,
} from './test-results.js';

// ============================================================================
// Triage Providers
// ============================================================================

export {
    BeadsProvider,
    type BeadsProviderConfig,
    type CreateIssueOptions,
    clearProviders,
    createBestProvider,
    createProvider,
    type DependencyType,
    GitHubProvider,
    type GitHubProviderConfig,
    getAllProviders,
    getCombinedStats,
    getProvider as getTriageProvider,
    type IssueDependency,
    type IssuePriority,
    type IssueStatus,
    type IssueType,
    type JiraProviderConfig,
    type LinearProviderConfig,
    type ListIssuesOptions,
    normalizePriority,
    normalizeStatus,
    normalizeType,
    type ProviderConfig,
    type ProviderStats,
    priorityToNumber,
    type ReadyWork,
    registerProvider,
    syncAllProviders,
    type TriageIssue,
    type TriageProvider,
    type UpdateIssueOptions,
} from './providers/index.js';

// ============================================================================
// Triage Unified API & Tools
// ============================================================================

export {
    addLabelsTool,
    closeIssueTool,
    createIssueTool,
    createTriageConnectors,
    getCurrentSprintTool,
    getIssueStatsTool,
    getIssueTool,
    getIssueTools,
    getPRCommentsTool,
    getProjectTools,
    getReadyWorkTool,
    getReviewTools,
    getTriageTools,
    ISSUE_TOOL_DEFINITIONS,
    listIssuesTool,
    listSprintsTool,
    PROJECT_TOOL_DEFINITIONS,
    REVIEW_TOOL_DEFINITIONS,
    removeLabelsTool,
    searchIssuesTool,
    setTriageConnectors,
    TriageConnectors,
    type TriageConnectorsConfig,
    updateIssueTool,
} from './triage/index.js';

// ============================================================================
// Queue & Scoring (from main)
// ============================================================================

export * from './mcp-server.js';
export * from './queue/index.js';
export * from './scoring/index.js';
export * from './storage/index.js';

// ============================================================================
// Escalation Ladder
// ============================================================================

export * from './escalation/index.js';
