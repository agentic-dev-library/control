/**
 * TriageConnectors - Unified API for Issue/Project/Review Management
 */

import {
    createBestProvider,
    createProvider,
    type JiraProviderConfig,
    type ProviderConfig,
} from '../providers/index.js';
import type {
    CreateIssueOptions,
    ListIssuesOptions,
    ProviderStats,
    ReadyWork,
    TriageIssue,
    TriageProvider,
    UpdateIssueOptions,
} from '../providers/types.js';

export interface TriageConnectorsConfig {
    /**
     * Provider type.
     */
    provider?: 'github' | 'jira' | 'beads';

    /**
     * GitHub specific configuration
     */
    github?: {
        repo: string;
        token?: string;
    };

    /**
     * Jira specific configuration
     */
    jira?: {
        host: string;
        email: string;
        apiToken: string;
        projectKey: string;
    };

    /**
     * Working directory for local providers (Beads)
     */
    workingDir?: string;
}

export class TriageConnectors {
    private config: TriageConnectorsConfig;
    private _provider: TriageProvider | null = null;
    private _initPromise: Promise<void> | null = null;

    public readonly issues: IssueAPI;

    constructor(config: TriageConnectorsConfig = {}) {
        this.config = config;
        this.issues = new IssueAPI(this);
    }

    async getProvider(): Promise<TriageProvider> {
        if (this._provider) return this._provider;
        if (this._initPromise) {
            await this._initPromise;
            return this._provider!;
        }
        this._initPromise = this.initializeProvider();
        await this._initPromise;
        return this._provider!;
    }

    private async initializeProvider(): Promise<void> {
        if (this.config.provider === 'jira' && this.config.jira) {
            this._provider = createProvider({
                type: 'jira',
                ...this.config.jira,
            });
        } else if (this.config.provider === 'github' && this.config.github) {
            this._provider = createProvider({
                type: 'github',
                repo: this.config.github.repo,
                token: this.config.github.token,
            });
        } else {
            this._provider = await createBestProvider({
                repo: this.config.github?.repo,
            });
        }
    }

    async isReady(): Promise<boolean> {
        try {
            const provider = await this.getProvider();
            return provider.isReady();
        } catch {
            return false;
        }
    }
}

class IssueAPI {
    constructor(private connectors: TriageConnectors) {}

    async create(options: CreateIssueOptions): Promise<TriageIssue> {
        const provider = await this.connectors.getProvider();
        return provider.createIssue(options);
    }

    async get(id: string): Promise<TriageIssue | null> {
        const provider = await this.connectors.getProvider();
        return provider.getIssue(id);
    }

    async update(id: string, options: UpdateIssueOptions): Promise<TriageIssue> {
        const provider = await this.connectors.getProvider();
        return provider.updateIssue(id, options);
    }

    async list(options?: ListIssuesOptions): Promise<TriageIssue[]> {
        const provider = await this.connectors.getProvider();
        return provider.listIssues(options);
    }

    async getStats(): Promise<ProviderStats> {
        const provider = await this.connectors.getProvider();
        return provider.getStats();
    }
}

let _globalConnectors: TriageConnectors | null = null;

export function setTriageConnectors(connectors: TriageConnectors): void {
    _globalConnectors = connectors;
}

export function getTriageConnectors(): TriageConnectors {
    if (!_globalConnectors) {
        _globalConnectors = new TriageConnectors();
    }
    return _globalConnectors;
}
