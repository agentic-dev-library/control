/**
 * Fleet - High-level API for Cursor Background Agent management
 *
 * Provides a clean interface for:
 * - Listing and monitoring agents
 * - Spawning new agents with context and model specification
 * - Sending follow-up messages
 * - Archiving conversations
 * - Diamond pattern orchestration
 * - Token-aware GitHub coordination
 *
 * All configuration is user-provided - no hardcoded values.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { log } from '../core/config.js';
import { extractOrg } from '../core/tokens.js';
import { GitHubClient } from '../github/client.js';
import { CursorAPI } from './cursor-api.js';
// ============================================
// Fleet Class
// ============================================
/**
 * Fleet management for Cursor Background Agents
 *
 * Provides high-level operations for managing AI agents across multiple
 * GitHub organizations with automatic token switching and coordination.
 *
 * @example
 * ```typescript
 * const fleet = new Fleet();
 *
 * // Spawn a new agent
 * const result = await fleet.spawn({
 *   repository: 'https://github.com/owner/repo',
 *   task: 'Fix the authentication bug',
 *   target: { autoCreatePr: true }
 * });
 *
 * // Monitor agent status
 * const status = await fleet.status(result.data.id);
 * ```
 */
export class Fleet {
    api;
    archivePath;
    useDirectApi;
    /**
     * Create a new Fleet instance
     *
     * @param config - Fleet configuration options including API key and timeout
     */
    constructor(config = {}) {
        this.archivePath = config.archivePath ?? './memory-bank/recovery';
        // Try to initialize CursorAPI for direct access
        try {
            this.api = new CursorAPI({
                apiKey: config.apiKey,
                timeout: config.timeout,
                maxRetries: config.maxRetries,
                retryDelay: config.retryDelay,
            });
            this.useDirectApi = true;
        }
        catch {
            // API key not available
            this.api = null;
            this.useDirectApi = false;
            log.debug('CursorAPI not available, some operations will fail');
        }
    }
    /**
     * Check if direct API is available
     */
    isApiAvailable() {
        return this.useDirectApi && this.api !== null;
    }
    // ============================================
    // Agent Discovery
    // ============================================
    /**
     * List all agents
     */
    async list() {
        if (!this.api) {
            return { success: false, error: 'Cursor API not available' };
        }
        return this.api.listAgents();
    }
    /**
     * List agents filtered by status
     */
    async listByStatus(status) {
        const result = await this.list();
        if (!result.success)
            return result;
        return {
            success: true,
            data: result.data?.filter((a) => a.status === status) ?? [],
        };
    }
    /**
     * Get running agents only
     */
    async running() {
        return this.listByStatus('RUNNING');
    }
    /**
     * Find agent by ID
     */
    async find(agentId) {
        const result = await this.list();
        if (!result.success)
            return { success: false, error: result.error };
        return { success: true, data: result.data?.find((a) => a.id === agentId) };
    }
    /**
     * Get agent status
     */
    async status(agentId) {
        if (!this.api) {
            return { success: false, error: 'Cursor API not available' };
        }
        return this.api.getAgentStatus(agentId);
    }
    // ============================================
    // Agent Spawning
    // ============================================
    /**
     * Spawn a new agent
     *
     * API Spec: https://cursor.com/docs/cloud-agent/api/endpoints
     *
     * @param options - Spawn options including repository, task, ref, target, and webhook
     */
    async spawn(options) {
        if (!this.api) {
            return { success: false, error: 'Cursor API not available' };
        }
        const task = this.buildTaskWithContext(options.task, options.context);
        log.info(`Spawning agent in ${options.repository}`);
        return this.api.launchAgent({
            prompt: { text: task },
            source: {
                repository: options.repository,
                ref: options.ref ?? 'main',
            },
            target: options.target,
            webhook: options.webhook,
        });
    }
    /**
     * Build task string with coordination context
     */
    buildTaskWithContext(task, context) {
        if (!context)
            return task;
        const lines = [task, '', '--- COORDINATION CONTEXT ---'];
        if (context.controlManagerId) {
            lines.push(`Control Manager Agent: ${context.controlManagerId}`);
        }
        if (context.controlCenter) {
            lines.push(`Control Center: ${context.controlCenter}`);
        }
        if (context.relatedAgents?.length) {
            lines.push(`Related Agents: ${context.relatedAgents.join(', ')}`);
        }
        if (context.metadata) {
            lines.push(`Metadata: ${JSON.stringify(context.metadata)}`);
        }
        lines.push('Report progress via PR comments and addFollowup.');
        lines.push('--- END CONTEXT ---');
        return lines.join('\n');
    }
    // ============================================
    // Agent Communication
    // ============================================
    /**
     * Send a follow-up message to an agent
     */
    async followup(agentId, message) {
        if (!this.api) {
            return { success: false, error: 'Cursor API not available' };
        }
        return this.api.addFollowup(agentId, { text: message });
    }
    /**
     * Broadcast message to multiple agents
     */
    async broadcast(agentIds, message) {
        const results = new Map();
        await Promise.all(agentIds.map(async (id) => {
            results.set(id, await this.followup(id, message));
        }));
        return results;
    }
    // ============================================
    // Conversations
    // ============================================
    /**
     * Get agent conversation
     */
    async conversation(agentId) {
        if (!this.api) {
            return { success: false, error: 'Cursor API not available' };
        }
        return this.api.getAgentConversation(agentId);
    }
    /**
     * Archive agent conversation to disk
     */
    async archive(agentId, outputPath) {
        const conv = await this.conversation(agentId);
        if (!conv.success)
            return { success: false, error: conv.error };
        const path = outputPath ?? join(this.archivePath, `conversation-${agentId}.json`);
        try {
            await mkdir(dirname(path), { recursive: true });
            await writeFile(path, JSON.stringify(conv.data, null, 2));
            return { success: true, data: path };
        }
        catch (error) {
            return { success: false, error: String(error) };
        }
    }
    // ============================================
    // Repositories
    // ============================================
    /**
     * List available repositories
     */
    async repositories() {
        if (!this.api) {
            return { success: false, error: 'Cursor API not available' };
        }
        return this.api.listRepositories();
    }
    /**
     * List available Cursor models
     */
    async listModels() {
        if (!this.api) {
            return { success: false, error: 'Cursor API not available' };
        }
        return this.api.listModels();
    }
    // ============================================
    // Diamond Pattern Orchestration
    // ============================================
    /**
     * Create a diamond pattern orchestration
     */
    async createDiamond(config) {
        // Get my agent ID for context
        const runningResult = await this.running();
        const myId = runningResult.data?.[0]?.id ?? 'control-manager';
        // Spawn target agents
        const targetAgents = [];
        for (const target of config.targetRepos) {
            const result = await this.spawn({
                ...target,
                context: {
                    controlManagerId: myId,
                    controlCenter: config.controlCenter,
                },
            });
            if (result.success && result.data) {
                targetAgents.push(result.data);
            }
        }
        // Spawn counterparty with knowledge of target agents
        const counterpartyResult = await this.spawn({
            ...config.counterparty,
            context: {
                controlManagerId: myId,
                controlCenter: config.controlCenter,
                relatedAgents: targetAgents.map((a) => a.id),
                metadata: {
                    pattern: 'diamond',
                    targetRepos: config.targetRepos.map((t) => t.repository),
                },
            },
        });
        if (!counterpartyResult.success || !counterpartyResult.data) {
            return {
                success: false,
                error: counterpartyResult.error ?? 'Failed to spawn counterparty',
            };
        }
        // Notify target agents about counterparty
        for (const agent of targetAgents) {
            await this.followup(agent.id, `Counterparty agent spawned: ${counterpartyResult.data.id}\n` +
                `You may receive direct communication from this agent for coordination.`);
        }
        return {
            success: true,
            data: {
                targetAgents,
                counterpartyAgent: counterpartyResult.data,
            },
        };
    }
    // ============================================
    // Fleet Monitoring
    // ============================================
    /**
     * Get fleet summary
     */
    async summary() {
        const result = await this.list();
        if (!result.success)
            return { success: false, error: result.error };
        const agents = result.data ?? [];
        return {
            success: true,
            data: {
                total: agents.length,
                running: agents.filter((a) => a.status === 'RUNNING').length,
                completed: agents.filter((a) => a.status === 'COMPLETED' || a.status === 'FINISHED').length,
                failed: agents.filter((a) => a.status === 'FAILED').length,
                agents,
            },
        };
    }
    /**
     * Wait for agent to complete
     */
    async waitFor(agentId, options) {
        const timeout = options?.timeout ?? 300000;
        const pollInterval = options?.pollInterval ?? 10000;
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const result = await this.status(agentId);
            if (!result.success)
                return result;
            if (result.data?.status !== 'RUNNING') {
                return result;
            }
            await new Promise((r) => setTimeout(r, pollInterval));
        }
        return { success: false, error: `Timeout waiting for agent ${agentId}` };
    }
    /**
     * Monitor specific agents until all complete
     */
    async monitorAgents(agentIds, options) {
        const pollInterval = options?.pollInterval ?? 15000;
        const results = new Map();
        const pending = new Set(agentIds);
        const nonTerminalStates = new Set(['RUNNING', 'PENDING']);
        while (pending.size > 0) {
            const statusMap = new Map();
            for (const id of pending) {
                const result = await this.status(id);
                if (result.success && result.data) {
                    statusMap.set(id, result.data.status);
                    if (!nonTerminalStates.has(result.data.status)) {
                        results.set(id, result.data);
                        pending.delete(id);
                    }
                }
            }
            options?.onProgress?.(statusMap);
            if (pending.size > 0) {
                await new Promise((r) => setTimeout(r, pollInterval));
            }
        }
        return results;
    }
    // ============================================
    // GitHub Coordination (Token-Aware, Using GitHubClient)
    // ============================================
    /**
     * Run bidirectional coordination loop with intelligent token switching
     */
    async coordinate(config) {
        const outboundInterval = config.outboundInterval ?? 60000;
        const inboundInterval = config.inboundInterval ?? 15000;
        const agentIds = new Set(config.agentIds ?? []);
        const processedCommentIds = new Set();
        // Parse repo into owner/name
        const [owner, repo] = config.repo.split('/');
        if (!owner || !repo) {
            throw new Error("Invalid repo format. Expected 'owner/repo'");
        }
        log.info('=== Fleet Coordinator Started ===');
        log.info(`Coordination PR: #${config.coordinationPr}`);
        log.info(`Monitoring ${agentIds.size} agents`);
        log.info(`Using token for org: ${extractOrg(config.repo)}`);
        // Run both loops concurrently
        await Promise.all([
            this.outboundLoop(config, agentIds, outboundInterval),
            this.inboundLoop(config, owner, repo, agentIds, processedCommentIds, inboundInterval),
        ]);
    }
    async outboundLoop(config, agentIds, interval) {
        while (true) {
            try {
                log.debug(`[OUTBOUND] Checking ${agentIds.size} agents...`);
                for (const agentId of [...agentIds]) {
                    const result = await this.status(agentId);
                    if (!result.success || !result.data) {
                        log.warn(`${agentId.slice(0, 12)}: Unable to fetch status`);
                        continue;
                    }
                    const agent = result.data;
                    if (agent.status === 'RUNNING') {
                        const message = [
                            '📊 STATUS CHECK from Fleet Coordinator',
                            '',
                            'Report progress by commenting on the coordination PR:',
                            `https://github.com/${config.repo}/pull/${config.coordinationPr}`,
                        ].join('\n');
                        await this.followup(agentId, message);
                    }
                    else {
                        agentIds.delete(agentId);
                    }
                }
            }
            catch (err) {
                log.error('[OUTBOUND ERROR]', err);
            }
            await new Promise((r) => setTimeout(r, interval));
        }
    }
    async inboundLoop(config, owner, repo, agentIds, processedIds, interval) {
        while (true) {
            try {
                // Use GitHubClient for safe API calls (no shell injection)
                const commentsResult = await GitHubClient.listPRComments(owner, repo, config.coordinationPr);
                if (!commentsResult.success || !commentsResult.data) {
                    log.warn('[INBOUND] Failed to fetch comments:', commentsResult.error);
                    await new Promise((r) => setTimeout(r, interval));
                    continue;
                }
                for (const comment of commentsResult.data) {
                    if (processedIds.has(comment.id))
                        continue;
                    if (comment.body.includes('@cursor')) {
                        log.info(`[INBOUND] New @cursor mention from ${comment.author}`);
                        await this.processCoordinationComment(owner, repo, config, agentIds, comment);
                    }
                    processedIds.add(comment.id);
                }
            }
            catch (err) {
                log.error('[INBOUND ERROR]', err);
            }
            await new Promise((r) => setTimeout(r, interval));
        }
    }
    async processCoordinationComment(owner, repo, config, agentIds, comment) {
        const body = comment.body;
        if (body.includes('✅ DONE:')) {
            const match = body.match(/✅ DONE:\s*(bc-[\w-]+)\s*(.*)/);
            const agentId = match?.[1];
            const summary = match?.[2];
            if (agentId && summary !== undefined) {
                log.info(`Agent ${agentId} completed: ${summary}`);
                agentIds.delete(agentId);
                // Use GitHubClient for posting (uses PR review token)
                await GitHubClient.postPRComment(owner, repo, config.coordinationPr, `✅ Acknowledged completion from ${agentId.slice(0, 12)}. Summary: ${summary}`);
            }
        }
        else if (body.includes('⚠️ BLOCKED:')) {
            const match = body.match(/⚠️ BLOCKED:\s*(bc-[\w-]+)\s*(.*)/);
            const agentId = match?.[1];
            const issue = match?.[2];
            if (agentId && issue !== undefined) {
                log.warn(`Agent ${agentId} blocked: ${issue}`);
                await GitHubClient.postPRComment(owner, repo, config.coordinationPr, `⚠️ Agent ${agentId.slice(0, 12)} blocked: ${issue}\n\nManual intervention may be required.`);
            }
        }
    }
}
//# sourceMappingURL=fleet.js.map