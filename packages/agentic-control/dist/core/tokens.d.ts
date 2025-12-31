/**
 * Intelligent Token Management for Multi-Organization GitHub Access
 *
 * This module provides automatic token switching based on repository organization.
 * ALL configuration is user-provided - no hardcoded organizations or tokens.
 *
 * Configuration methods (in priority order):
 * 1. Programmatic: setTokenConfig() / addOrganization()
 * 2. Config file: agentic.config.json with "tokens" section
 * 3. Environment variables: AGENTIC_ORG_<NAME>_TOKEN pattern
 *
 * @example Config file (agentic.config.json):
 * ```json
 * {
 *   "tokens": {
 *     "organizations": {
 *       "MyOrg": { "name": "MyOrg", "tokenEnvVar": "GITHUB_MYORG_TOKEN" },
 *       "AnotherOrg": { "name": "AnotherOrg", "tokenEnvVar": "ANOTHER_TOKEN" }
 *     },
 *     "defaultTokenEnvVar": "GITHUB_TOKEN",
 *     "prReviewTokenEnvVar": "GITHUB_TOKEN"
 *   }
 * }
 * ```
 *
 * @example Environment variables:
 * ```bash
 * # Define org-to-token mappings
 * export AGENTIC_ORG_MYORG_TOKEN=GITHUB_MYORG_TOKEN
 * export AGENTIC_ORG_ANOTHER_TOKEN=ANOTHER_ORG_PAT
 *
 * # Override defaults
 * export AGENTIC_DEFAULT_TOKEN=GITHUB_TOKEN
 * export AGENTIC_PR_REVIEW_TOKEN=GITHUB_TOKEN
 * ```
 */
import type { OrganizationConfig, Result, TokenConfig } from './types.js';
/**
 * Get the current token configuration
 */
export declare function getTokenConfig(): TokenConfig;
/**
 * Update the token configuration
 *
 * @example
 * setTokenConfig({
 *   organizations: {
 *     "my-org": { name: "my-org", tokenEnvVar: "MY_ORG_TOKEN" }
 *   },
 *   prReviewTokenEnvVar: "PR_REVIEW_TOKEN"
 * });
 */
export declare function setTokenConfig(config: Partial<TokenConfig>): void;
/**
 * Reset configuration to defaults (useful for testing)
 */
export declare function resetTokenConfig(): void;
/**
 * Add or update an organization configuration
 *
 * @example
 * addOrganization({
 *   name: "my-company",
 *   tokenEnvVar: "GITHUB_MYCOMPANY_TOKEN",
 *   defaultBranch: "main",
 *   isEnterprise: true
 * });
 */
export declare function addOrganization(org: OrganizationConfig): void;
/**
 * Remove an organization configuration
 */
export declare function removeOrganization(orgName: string): void;
/**
 * Extract organization name from a repository URL or full name
 * Uses a safe regex pattern to prevent ReDoS attacks
 *
 * @example
 * extractOrg("https://github.com/my-org/my-repo") // "my-org"
 * extractOrg("my-org/my-repo") // "my-org"
 * extractOrg("git@github.com:my-org/my-repo.git") // "my-org"
 */
export declare function extractOrg(repoUrl: string): string | null;
/**
 * Get the token environment variable name for a given organization
 * Returns the default if org is not configured
 *
 * @param org - Organization name (case-insensitive)
 */
export declare function getTokenEnvVar(org: string): string;
/**
 * Get the actual token value for an organization
 *
 * @param org - Organization name
 * @returns Token value or undefined if not set
 */
export declare function getTokenForOrg(org: string): string | undefined;
/**
 * Get the token for a repository URL
 * Automatically extracts the organization and returns the appropriate token
 *
 * @param repoUrl - Repository URL or owner/repo format
 * @returns Token value or undefined if not set
 *
 * @example
 * // If configured: addOrganization({ name: "myorg", tokenEnvVar: "MYORG_TOKEN" })
 * getTokenForRepo("https://github.com/myorg/my-repo")
 * // Returns value of MYORG_TOKEN
 */
export declare function getTokenForRepo(repoUrl: string): string | undefined;
/**
 * Get the token that should be used for PR reviews
 * Ensures a consistent identity across all PR interactions
 *
 * @returns Token value or undefined if not set
 */
export declare function getPRReviewToken(): string | undefined;
/**
 * Get the PR review token environment variable name
 */
export declare function getPRReviewTokenEnvVar(): string;
/**
 * Validate that required tokens are available
 *
 * @param orgs - Organization names to validate (optional, validates all configured if not specified)
 * @returns Validation result with any missing tokens
 */
export declare function validateTokens(orgs?: string[]): Result<string[]>;
/**
 * Get organization configuration (case-insensitive)
 */
export declare function getOrgConfig(org: string): OrganizationConfig | undefined;
/**
 * Get all configured organizations
 */
export declare function getConfiguredOrgs(): string[];
/**
 * Check if an organization is configured (case-insensitive)
 */
export declare function isOrgConfigured(org: string): boolean;
/**
 * Create environment variables object for a subprocess targeting a specific org
 * Useful when spawning child processes that need the correct GitHub token
 *
 * @param repoUrl - Repository URL to get token for
 * @returns Object with GH_TOKEN and GITHUB_TOKEN set
 *
 * @example
 * import { spawnSync } from 'node:child_process';
 * const proc = spawnSync('gh', ['pr', 'list'], {
 *   env: { ...process.env, ...getEnvForRepo("owner/repo") }
 * });
 */
export declare function getEnvForRepo(repoUrl: string): Record<string, string>;
/**
 * Create environment variables for PR review operations
 * Uses the configured PR review identity
 *
 * @returns Object with GH_TOKEN and GITHUB_TOKEN set for PR review
 */
export declare function getEnvForPRReview(): Record<string, string>;
/**
 * Check if we have a valid token for an organization
 */
export declare function hasTokenForOrg(org: string): boolean;
/**
 * Check if we have a valid token for a repository
 */
export declare function hasTokenForRepo(repoUrl: string): boolean;
/**
 * Get a summary of token availability for debugging/display
 */
export declare function getTokenSummary(): Record<string, {
    envVar: string;
    available: boolean;
    configured: boolean;
}>;
//# sourceMappingURL=tokens.d.ts.map