import type {
    BeadsProviderConfig,
    CreateIssueOptions,
    IssuePriority,
    ListIssuesOptions,
    ProviderStats,
    ReadyWork,
    TriageIssue,
    TriageProvider,
    UpdateIssueOptions,
} from './types.js';

export class BeadsProvider implements TriageProvider {
    readonly name = 'beads';
    readonly displayName = 'Beads';

    constructor(public readonly config: BeadsProviderConfig = { type: 'beads' }) {}

    async isReady(): Promise<boolean> {
        return false;
    }

    async createIssue(_options: CreateIssueOptions): Promise<TriageIssue> {
        throw new Error('Beads provider not implemented');
    }

    async getIssue(_id: string): Promise<TriageIssue | null> {
        throw new Error('Beads provider not implemented');
    }

    async updateIssue(_id: string, _options: UpdateIssueOptions): Promise<TriageIssue> {
        throw new Error('Beads provider not implemented');
    }

    async closeIssue(_id: string, _reason?: string): Promise<TriageIssue> {
        throw new Error('Beads provider not implemented');
    }

    async reopenIssue(_id: string, _reason?: string): Promise<TriageIssue> {
        throw new Error('Beads provider not implemented');
    }

    async listIssues(_options?: ListIssuesOptions): Promise<TriageIssue[]> {
        return [];
    }

    async getReadyWork(_options?: { limit?: number; priority?: IssuePriority }): Promise<ReadyWork[]> {
        return [];
    }

    async getBlockedIssues(): Promise<TriageIssue[]> {
        return [];
    }

    async searchIssues(_query: string, _options?: ListIssuesOptions): Promise<TriageIssue[]> {
        return [];
    }

    async addLabels(_id: string, _labels: string[]): Promise<void> {
        throw new Error('Beads provider not implemented');
    }

    async removeLabels(_id: string, _labels: string[]): Promise<void> {
        throw new Error('Beads provider not implemented');
    }

    async getStats(): Promise<ProviderStats> {
        return {
            total: 0,
            open: 0,
            inProgress: 0,
            blocked: 0,
            closed: 0,
            byPriority: { critical: 0, high: 0, medium: 0, low: 0, backlog: 0 },
            byType: { bug: 0, feature: 0, task: 0, epic: 0, chore: 0, docs: 0 },
        };
    }
}
