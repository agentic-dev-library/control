/**
 * Configuration Management for agentic-control
 *
 * Uses cosmiconfig for standard config file discovery and loading.
 * Searches for configuration in:
 *   - agentic.config.json
 *   - agentic.config.js
 *   - agentic.config.cjs
 *   - .agenticrc
 *   - .agenticrc.json
 *   - package.json "agentic" key
 *
 * Priority: CLI args > env vars > config file > defaults
 *
 * @example Config file (agentic.config.json):
 * ```json
 * {
 *   "tokens": {
 *     "organizations": {
 *       "my-org": { "name": "my-org", "tokenEnvVar": "MY_ORG_TOKEN" }
 *     }
 *   },
 *   "defaultModel": "claude-sonnet-4-20250514",
 *   "fleet": {
 *     "autoCreatePr": true
 *   }
 * }
 * ```
 */
import { cosmiconfigSync } from 'cosmiconfig';
import { setTokenConfig } from './tokens.js';
import { validateConfig } from './validation.js';
// ============================================
// Cosmiconfig Setup
// ============================================
const MODULE_NAME = 'agentic';
// Security: Only allow JSON config files to prevent code execution
// JavaScript config files could execute arbitrary code during require()
const explorer = cosmiconfigSync(MODULE_NAME, {
    searchPlaces: ['package.json', 'agentic.config.json', '.agenticrc', '.agenticrc.json'],
    // Security: Disable loaders that execute code
    loaders: {
        '.json': (_filepath, content) => JSON.parse(content),
    },
});
// ============================================
// Configuration State
// ============================================
let config = {};
let configLoaded = false;
let configPath = null;
// ============================================
// Environment Variable Loading
// ============================================
function loadEnvConfig() {
    const envConfig = {};
    // Build triage config from environment variables
    const triageFromEnv = {};
    if (process.env.AGENTIC_MODEL) {
        triageFromEnv.model = process.env.AGENTIC_MODEL;
    }
    if (process.env.AGENTIC_PROVIDER) {
        triageFromEnv.provider = process.env.AGENTIC_PROVIDER;
    }
    if (Object.keys(triageFromEnv).length > 0) {
        envConfig.triage = triageFromEnv;
    }
    if (process.env.AGENTIC_REPOSITORY) {
        envConfig.defaultRepository = process.env.AGENTIC_REPOSITORY;
    }
    if (process.env.AGENTIC_COORDINATION_PR) {
        const parsed = Number.parseInt(process.env.AGENTIC_COORDINATION_PR, 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
            envConfig.coordinationPr = parsed;
        }
    }
    if (process.env.AGENTIC_LOG_LEVEL) {
        const level = process.env.AGENTIC_LOG_LEVEL.toLowerCase();
        if (['debug', 'info', 'warn', 'error'].includes(level)) {
            envConfig.logLevel = level;
        }
    }
    if (process.env.AGENTIC_VERBOSE === 'true' || process.env.AGENTIC_VERBOSE === '1') {
        envConfig.verbose = true;
    }
    return envConfig;
}
// ============================================
// Configuration Loading
// ============================================
/**
 * Deep merge configuration objects
 */
function mergeConfig(base, overrides) {
    const result = { ...base };
    for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined)
            continue;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const baseValue = base[key];
            // Only spread baseValue if it's a non-null object
            const baseObj = typeof baseValue === 'object' && baseValue !== null && !Array.isArray(baseValue)
                ? baseValue
                : {};
            result[key] = {
                ...baseObj,
                ...value,
            };
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Initialize configuration from all sources
 * Priority: programmatic overrides > env vars > config file
 */
export function initConfig(overrides) {
    // Search for config file using cosmiconfig
    const result = explorer.search();
    if (result && !result.isEmpty) {
        // Validate configuration before using it
        validateConfig(result.config);
        config = result.config;
        configPath = result.filepath;
    }
    else {
        config = {};
        configPath = null;
    }
    // Merge environment variables
    const envConfig = loadEnvConfig();
    config = mergeConfig(config, envConfig);
    // Apply programmatic overrides
    if (overrides) {
        config = mergeConfig(config, overrides);
    }
    // Validate final configuration
    validateConfig(config);
    // Apply token configuration
    if (config.tokens) {
        setTokenConfig(config.tokens);
    }
    configLoaded = true;
    return config;
}
/**
 * Load config from a specific file path
 */
export function loadConfigFromPath(filepath) {
    const result = explorer.load(filepath);
    if (result && !result.isEmpty) {
        // Validate configuration before using it
        validateConfig(result.config);
        config = result.config;
        configPath = result.filepath;
        if (config.tokens) {
            setTokenConfig(config.tokens);
        }
        configLoaded = true;
        return config;
    }
    throw new Error(`Failed to load config from ${filepath}`);
}
// ============================================
// Public API
// ============================================
/**
 * Get the current configuration
 */
export function getConfig() {
    if (!configLoaded) {
        initConfig();
    }
    return { ...config };
}
/**
 * Get path to loaded config file
 */
export function getConfigPath() {
    return configPath;
}
/**
 * Update configuration at runtime
 */
export function setConfig(updates) {
    config = mergeConfig(config, updates);
    if (updates.tokens) {
        setTokenConfig(updates.tokens);
    }
}
/**
 * Reset configuration (useful for testing)
 */
export function resetConfig() {
    config = {};
    configLoaded = false;
    configPath = null;
}
/**
 * Get a specific configuration value
 */
export function getConfigValue(key) {
    if (!configLoaded) {
        initConfig();
    }
    return config[key];
}
/**
 * Check if verbose mode is enabled
 */
export function isVerbose() {
    return config.verbose ?? false;
}
/**
 * Get triage configuration
 */
export function getTriageConfig() {
    if (!configLoaded) {
        initConfig();
    }
    return (config.triage ?? {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    });
}
/**
 * Get the default model for triage operations
 * @deprecated Use getTriageConfig() instead
 */
export function getDefaultModel() {
    return getTriageConfig().model ?? 'claude-sonnet-4-20250514';
}
/**
 * Get fleet defaults
 */
export function getFleetDefaults() {
    if (!configLoaded) {
        initConfig();
    }
    return config.fleet ?? {};
}
/**
 * Get the log level
 */
export function getLogLevel() {
    return config.logLevel ?? 'info';
}
/**
 * Get Cursor API key from configured environment variable
 */
export function getCursorApiKey() {
    const envVar = config.cursor?.apiKeyEnvVar ?? 'CURSOR_API_KEY';
    return process.env[envVar];
}
/**
 * Get default API key env var for a provider
 */
export function getDefaultApiKeyEnvVar(provider) {
    switch (provider) {
        case 'openai':
            return 'OPENAI_API_KEY';
        case 'google':
            return 'GOOGLE_API_KEY';
        case 'mistral':
            return 'MISTRAL_API_KEY';
        case 'azure':
            return 'AZURE_API_KEY';
        case 'ollama':
            return 'OLLAMA_API_KEY';
        default:
            return 'ANTHROPIC_API_KEY';
    }
}
/**
 * Get triage API key from configured environment variable
 * @param providerOverride - Optional provider to use instead of config value
 */
export function getTriageApiKey(providerOverride) {
    const triageConfig = getTriageConfig();
    const provider = providerOverride ?? triageConfig.provider;
    const envVar = triageConfig.apiKeyEnvVar ?? getDefaultApiKeyEnvVar(provider);
    return process.env[envVar];
}
// ============================================
// Logging Utilities
// ============================================
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
function shouldLog(level) {
    const currentLevel = LOG_LEVELS[getLogLevel()] ?? 1;
    return LOG_LEVELS[level] >= currentLevel;
}
export const log = {
    debug: (...args) => {
        if (shouldLog('debug')) {
            console.debug('[agentic:debug]', ...args);
        }
    },
    info: (...args) => {
        if (shouldLog('info')) {
            console.log('[agentic:info]', ...args);
        }
    },
    warn: (...args) => {
        if (shouldLog('warn')) {
            console.warn('[agentic:warn]', ...args);
        }
    },
    error: (...args) => {
        if (shouldLog('error')) {
            console.error('[agentic:error]', ...args);
        }
    },
};
//# sourceMappingURL=config.js.map