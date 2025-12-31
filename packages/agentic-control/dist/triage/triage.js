import { GitHubClient } from '../github/client.js';
import { Analyzer } from './analyzer.js';
import { Resolver } from './resolver.js';
export class Triage {
    github;
    analyzer;
    resolver;
    constructor(config) {
        this.github = new GitHubClient(config.github);
        this.analyzer = new Analyzer();
        this.resolver = new Resolver(config.resolver);
    }
    // ==========================================================================
    // Analysis
    // ==========================================================================
    /**
     * Analyze a PR and return its current triage status
     */
    async analyze(prNumber) {
        return this.analyzer.analyzePR(this.github, prNumber);
    }
    // ==========================================================================
    // Resolution
    // ==========================================================================
    /**
     * Resolve all auto-resolvable blockers and feedback
     */
    async resolve(prNumber) {
        const triage = await this.analyze(prNumber);
        const actions = [];
        // Resolve blockers first
        const blockerResults = await this.resolver.resolveBlockers(this.github, triage);
        actions.push(...blockerResults);
        // Then resolve feedback
        const feedbackResults = await this.resolver.resolveFeedback(this.github, triage);
        actions.push(...feedbackResults);
        // Re-analyze after resolution
        const updatedTriage = await this.analyze(prNumber);
        return {
            triage: updatedTriage,
            actions,
        };
    }
    /**
     * Generate a plan for resolving all issues without executing
     */
    async plan(prNumber) {
        const triage = await this.analyze(prNumber);
        const steps = [];
        let order = 1;
        // CI failures first
        for (const blocker of triage.blockers.filter((b) => b.type === 'ci_failure')) {
            steps.push({
                order: order++,
                action: 'Fix CI failure',
                description: blocker.description,
                automated: blocker.isAutoResolvable,
                estimatedDuration: '5-10 minutes',
                dependencies: [],
            });
        }
        // Then feedback
        const feedbackStep = order;
        const unaddressed = triage.feedback.items.filter((f) => f.status === 'unaddressed');
        if (unaddressed.length > 0) {
            steps.push({
                order: order++,
                action: 'Address feedback',
                description: `${unaddressed.length} feedback items to address`,
                automated: unaddressed.every((f) => f.isAutoResolvable),
                estimatedDuration: `${unaddressed.length * 2}-${unaddressed.length * 5} minutes`,
                dependencies: steps.filter((s) => s.action === 'Fix CI failure').map((s) => s.order),
            });
        }
        // Request re-review if needed
        if (steps.length > 0) {
            steps.push({
                order: order++,
                action: 'Request re-review',
                description: 'Request AI reviewers to re-review changes',
                automated: true,
                estimatedDuration: '1-5 minutes',
                dependencies: [feedbackStep],
            });
        }
        // Wait for CI
        steps.push({
            order: order++,
            action: 'Wait for CI',
            description: 'Wait for all CI checks to complete',
            automated: true,
            estimatedDuration: '5-15 minutes',
            dependencies: steps.map((s) => s.order),
        });
        // Final merge
        steps.push({
            order: order++,
            action: 'Merge PR',
            description: 'Merge the PR once all checks pass',
            automated: false, // Requires explicit approval
            estimatedDuration: '1 minute',
            dependencies: [order - 1],
        });
        const hasHumanStep = steps.some((s) => !s.automated);
        return {
            prNumber,
            steps,
            estimatedTotalDuration: '15-30 minutes',
            requiresHumanIntervention: hasHumanStep,
            humanInterventionReason: hasHumanStep ? 'Some steps require manual review or approval' : null,
        };
    }
    // ==========================================================================
    // Workflows
    // ==========================================================================
    /**
     * Run the full workflow until PR is ready to merge
     */
    async runUntilReady(prNumber, options = {}) {
        const maxIterations = options.maxIterations ?? 10;
        const allActions = [];
        let iteration = 0;
        while (iteration < maxIterations) {
            iteration++;
            const triage = await this.analyze(prNumber);
            options.onProgress?.(triage, iteration);
            if (triage.status === 'ready_to_merge') {
                return {
                    success: true,
                    finalTriage: triage,
                    iterations: iteration,
                    allActions,
                };
            }
            if (triage.status === 'blocked') {
                return {
                    success: false,
                    finalTriage: triage,
                    iterations: iteration,
                    allActions,
                };
            }
            if (triage.status === 'needs_ci') {
                // Wait for CI to complete
                await this.waitForCI(prNumber);
                continue;
            }
            // Resolve what we can
            const { actions } = await this.resolve(prNumber);
            allActions.push(...actions);
            // If no actions were successful, we're stuck
            const successfulActions = actions.filter((a) => a.success);
            if (successfulActions.length === 0) {
                return {
                    success: false,
                    finalTriage: triage,
                    iterations: iteration,
                    allActions,
                };
            }
            // Commit any changes
            const hasChanges = actions.some((a) => a.changes && a.changes.length > 0);
            if (hasChanges) {
                await this.resolver.commitAndPush(`fix: address feedback (iteration ${iteration})`);
            }
            // Small delay before next iteration
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        const finalTriage = await this.analyze(prNumber);
        return {
            success: finalTriage.status === 'ready_to_merge',
            finalTriage,
            iterations: iteration,
            allActions,
        };
    }
    async waitForCI(prNumber, timeoutMs = 600000) {
        const startTime = Date.now();
        const pollInterval = 30000; // 30 seconds
        while (Date.now() - startTime < timeoutMs) {
            const ci = await this.github.getCIStatus(prNumber);
            if (!ci.anyPending) {
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
        throw new Error('CI timeout exceeded');
    }
    // ==========================================================================
    // Review Requests
    // ==========================================================================
    async requestReviews(prNumber) {
        // Post review request commands as comments
        const reviewCommands = ['/gemini review', '/q review'];
        for (const command of reviewCommands) {
            await this.github.postComment(prNumber, command);
        }
    }
    // ==========================================================================
    // Reporting
    // ==========================================================================
    formatTriageReport(triage) {
        const lines = [];
        lines.push(`# Triage Report: PR #${triage.prNumber}`);
        lines.push('');
        lines.push(`**Title:** ${triage.prTitle}`);
        lines.push(`**Status:** ${triage.status}`);
        lines.push(`**URL:** ${triage.prUrl}`);
        lines.push('');
        lines.push('## CI Status');
        lines.push(triage.ci.allPassing ? '✅ All checks passing' : '');
        lines.push(triage.ci.anyPending ? '⏳ Checks pending' : '');
        if (triage.ci.failures.length > 0) {
            lines.push(`❌ ${triage.ci.failures.length} failing checks:`);
            for (const failure of triage.ci.failures) {
                lines.push(`  - ${failure.name}: ${failure.url}`);
            }
        }
        lines.push('');
        lines.push('## Feedback');
        lines.push(`Total: ${triage.feedback.total} | Unaddressed: ${triage.feedback.unaddressed}`);
        if (triage.feedback.unaddressed > 0) {
            lines.push('');
            lines.push('### Unaddressed Items:');
            for (const item of triage.feedback.items.filter((f) => f.status === 'unaddressed')) {
                lines.push(`- **${item.severity}** from ${item.author}: ${item.body.slice(0, 100)}...`);
                if (item.isAutoResolvable) {
                    lines.push(`  - ✅ Auto-resolvable`);
                }
            }
        }
        lines.push('');
        lines.push('## Blockers');
        if (triage.blockers.length === 0) {
            lines.push('None');
        }
        else {
            for (const blocker of triage.blockers) {
                lines.push(`- **${blocker.type}**: ${blocker.description}`);
                lines.push(`  - Auto-resolvable: ${blocker.isAutoResolvable ? 'Yes' : 'No'}`);
            }
        }
        lines.push('');
        lines.push('## Next Actions');
        for (const action of triage.nextActions) {
            const icon = action.automated ? '🤖' : '👤';
            lines.push(`${icon} [${action.priority}] ${action.action}`);
        }
        lines.push('');
        lines.push('## Summary');
        lines.push(triage.summary);
        lines.push('');
        lines.push(`_Generated: ${triage.timestamp}_`);
        return lines.join('\n');
    }
}
//# sourceMappingURL=triage.js.map