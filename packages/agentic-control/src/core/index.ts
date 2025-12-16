/**
 * Core module for agentic-control
 *
 * Exports types, token management, configuration, and AI providers
 */

// Types
export * from './types.js';

// Token management
export {
    addOrganization,
    extractOrg,
    getConfiguredOrgs,
    getEnvForPRReview,
    getEnvForRepo,
    getOrgConfig,
    getPRReviewToken,
    getPRReviewTokenEnvVar,
    getTokenConfig,
    getTokenEnvVar,
    getTokenForOrg,
    getTokenForRepo,
    getTokenSummary,
    hasTokenForOrg,
    hasTokenForRepo,
    setTokenConfig,
    validateTokens,
} from './tokens.js';

// Configuration
export {
    getConfig,
    getConfigPath,
    getConfigValue,
    getCursorApiKey,
    getDefaultApiKeyEnvVar,
    getDefaultModel,
    getFleetDefaults,
    getLogLevel,
    getTriageApiKey,
    getTriageConfig,
    initConfig,
    isVerbose,
    loadConfigFromPath,
    log,
    resetConfig,
    setConfig,
    type AgenticConfig,
    type FleetConfig,
    type TriageConfig,
} from './config.js';

// AI Provider loading
export {
    PROVIDER_CONFIG,
    clearProviderCache,
    getOrLoadProvider,
    getSupportedProviders,
    isValidProvider,
    loadProvider,
    resolveProviderOptions,
    type ModelFactory,
    type ProviderOptions,
    type SupportedProvider,
} from './providers.js';

// Security utilities
export { createSafeError, safeConsole, sanitizeEnvironment, sanitizeError } from './security.js';

// Typed errors
export {
    ConfigErrorCode,
    ConfigurationError,
    DockerBuildError,
    DockerErrorCode,
    SandboxError,
    SandboxErrorCode,
} from './errors.js';

// Configuration validation
export {
    AgenticConfigSchema,
    validateConfig,
    validateEnvVar,
    validateEnvVarWithMessage,
    validateGitRef,
    validatePositiveInt,
    validateRepository,
} from './validation.js';

// Safe subprocess execution
export {
    safeDockerCommand,
    safeGitCommand,
    safeSpawn,
    safeSpawnSync,
    validateCommandArgs,
} from './subprocess.js';
