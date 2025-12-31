/**
 * Triage Providers
 */

export { GitHubProvider } from './github.js';
export { JiraProvider } from './jira.js';
export * from './types.js';

import { GitHubProvider } from './github.js';
import { JiraProvider } from './jira.js';
import type { ProviderConfig, TriageProvider } from './types.js';

/**
 * Create a triage provider from configuration
 */
export function createProvider(config: ProviderConfig): TriageProvider {
    switch (config.type) {
        case 'github':
            return new GitHubProvider(config);

        case 'jira':
            return new JiraProvider(config);

        case 'beads':
            throw new Error('Beads provider not yet implemented in this version.');

        default:
            throw new Error(`Unknown provider type: ${(config as any).type}`);
    }
}

/**
 * Detect and create the best provider based on environment
 */
export async function createBestProvider(options: { repo?: string } = {}): Promise<TriageProvider> {
    if (options.repo) {
        return new GitHubProvider({ type: 'github', repo: options.repo });
    }

    // Try to detect from environment or git
    const repo = process.env.GITHUB_REPOSITORY;
    if (repo) {
        return new GitHubProvider({ type: 'github', repo });
    }

    throw new Error('Could not auto-detect provider. Please provide configuration.');
}
