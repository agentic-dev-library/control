import { z } from 'zod';
/**
 * Severity levels for feedback items.
 * Used to prioritize which feedback needs immediate attention.
 *
 * @remarks
 * - `critical` - Must be addressed before merge, blocks deployment
 * - `high` - Should be addressed before merge
 * - `medium` - Should be addressed, but not blocking
 * - `low` - Nice to have improvements
 * - `info` - Informational comments, no action required
 */
export declare const FeedbackSeveritySchema: z.ZodEnum<{
    critical: "critical";
    high: "high";
    medium: "medium";
    low: "low";
    info: "info";
}>;
/** Severity level for feedback items */
export type FeedbackSeverity = z.infer<typeof FeedbackSeveritySchema>;
/**
 * Status of a feedback item indicating whether it has been addressed.
 *
 * @remarks
 * - `unaddressed` - Feedback has not been addressed yet
 * - `addressed` - Feedback has been addressed with code changes
 * - `dismissed` - Feedback was reviewed and dismissed as not applicable
 * - `wont_fix` - Feedback acknowledged but won't be fixed in this PR
 */
export declare const FeedbackStatusSchema: z.ZodEnum<{
    unaddressed: "unaddressed";
    addressed: "addressed";
    dismissed: "dismissed";
    wont_fix: "wont_fix";
}>;
/** Status of a feedback item */
export type FeedbackStatus = z.infer<typeof FeedbackStatusSchema>;
/**
 * Types of blockers that can prevent a PR from being merged.
 *
 * @remarks
 * - `ci_failure` - One or more CI checks have failed
 * - `review_feedback` - Unaddressed review comments
 * - `merge_conflict` - Branch has conflicts with base branch
 * - `missing_approval` - Required approvals not yet received
 * - `branch_protection` - Branch protection rules not satisfied
 * - `stale_branch` - Branch is significantly behind base branch
 */
export declare const BlockerTypeSchema: z.ZodEnum<{
    ci_failure: "ci_failure";
    review_feedback: "review_feedback";
    merge_conflict: "merge_conflict";
    missing_approval: "missing_approval";
    branch_protection: "branch_protection";
    stale_branch: "stale_branch";
}>;
/** Type of blocker preventing PR merge */
export type BlockerType = z.infer<typeof BlockerTypeSchema>;
/**
 * Overall status of a pull request in the triage workflow.
 *
 * @remarks
 * - `needs_work` - Has unaddressed blockers requiring code changes
 * - `needs_review` - Waiting for AI or human review
 * - `needs_ci` - Waiting for CI checks to complete
 * - `ready_to_merge` - All checks pass, feedback addressed, ready to merge
 * - `blocked` - Cannot proceed without human intervention
 * - `merged` - PR has been merged
 * - `closed` - PR was closed without merging
 */
export declare const PRStatusSchema: z.ZodEnum<{
    blocked: "blocked";
    closed: "closed";
    merged: "merged";
    needs_work: "needs_work";
    needs_review: "needs_review";
    needs_ci: "needs_ci";
    ready_to_merge: "ready_to_merge";
}>;
/** Overall status of a pull request */
export type PRStatus = z.infer<typeof PRStatusSchema>;
/**
 * Schema for a feedback item from a PR review.
 * Represents a single comment or suggestion from a reviewer.
 */
export declare const FeedbackItemSchema: z.ZodObject<{
    id: z.ZodString;
    author: z.ZodString;
    body: z.ZodString;
    path: z.ZodNullable<z.ZodString>;
    line: z.ZodNullable<z.ZodNumber>;
    severity: z.ZodEnum<{
        critical: "critical";
        high: "high";
        medium: "medium";
        low: "low";
        info: "info";
    }>;
    status: z.ZodEnum<{
        unaddressed: "unaddressed";
        addressed: "addressed";
        dismissed: "dismissed";
        wont_fix: "wont_fix";
    }>;
    createdAt: z.ZodString;
    url: z.ZodString;
    isAutoResolvable: z.ZodBoolean;
    suggestedAction: z.ZodNullable<z.ZodString>;
    resolution: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * A feedback item from a PR review.
 * Contains the review comment details, severity, status, and AI analysis.
 */
export type FeedbackItem = z.infer<typeof FeedbackItemSchema>;
/**
 * Schema for a blocker preventing PR merge.
 * Represents an issue that must be resolved before the PR can be merged.
 */
export declare const BlockerSchema: z.ZodObject<{
    type: z.ZodEnum<{
        ci_failure: "ci_failure";
        review_feedback: "review_feedback";
        merge_conflict: "merge_conflict";
        missing_approval: "missing_approval";
        branch_protection: "branch_protection";
        stale_branch: "stale_branch";
    }>;
    description: z.ZodString;
    isAutoResolvable: z.ZodBoolean;
    suggestedFix: z.ZodNullable<z.ZodString>;
    url: z.ZodNullable<z.ZodString>;
    resolved: z.ZodBoolean;
}, z.core.$strip>;
/**
 * A blocker preventing PR merge.
 * Includes the blocker type, description, and resolution status.
 */
export type Blocker = z.infer<typeof BlockerSchema>;
/**
 * Schema for a single CI check result.
 */
export declare const CICheckSchema: z.ZodObject<{
    name: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        in_progress: "in_progress";
        success: "success";
        failure: "failure";
        skipped: "skipped";
    }>;
    conclusion: z.ZodNullable<z.ZodString>;
    url: z.ZodString;
    startedAt: z.ZodNullable<z.ZodString>;
    completedAt: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * A single CI check result.
 * Contains the check name, status, and timing information.
 */
export type CICheck = z.infer<typeof CICheckSchema>;
/**
 * Schema for the overall CI status of a PR.
 */
export declare const CIStatusSchema: z.ZodObject<{
    allPassing: z.ZodBoolean;
    anyPending: z.ZodBoolean;
    checks: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        status: z.ZodEnum<{
            pending: "pending";
            in_progress: "in_progress";
            success: "success";
            failure: "failure";
            skipped: "skipped";
        }>;
        conclusion: z.ZodNullable<z.ZodString>;
        url: z.ZodString;
        startedAt: z.ZodNullable<z.ZodString>;
        completedAt: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    failures: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        status: z.ZodEnum<{
            pending: "pending";
            in_progress: "in_progress";
            success: "success";
            failure: "failure";
            skipped: "skipped";
        }>;
        conclusion: z.ZodNullable<z.ZodString>;
        url: z.ZodString;
        startedAt: z.ZodNullable<z.ZodString>;
        completedAt: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Overall CI status for a pull request.
 * Aggregates all CI check results with convenience flags.
 */
export type CIStatus = z.infer<typeof CIStatusSchema>;
/**
 * Schema for the complete triage result of a PR.
 * This is the main output of the triage process.
 */
export declare const TriageResultSchema: z.ZodObject<{
    prNumber: z.ZodNumber;
    prUrl: z.ZodString;
    prTitle: z.ZodString;
    status: z.ZodEnum<{
        blocked: "blocked";
        closed: "closed";
        merged: "merged";
        needs_work: "needs_work";
        needs_review: "needs_review";
        needs_ci: "needs_ci";
        ready_to_merge: "ready_to_merge";
    }>;
    ci: z.ZodObject<{
        allPassing: z.ZodBoolean;
        anyPending: z.ZodBoolean;
        checks: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            status: z.ZodEnum<{
                pending: "pending";
                in_progress: "in_progress";
                success: "success";
                failure: "failure";
                skipped: "skipped";
            }>;
            conclusion: z.ZodNullable<z.ZodString>;
            url: z.ZodString;
            startedAt: z.ZodNullable<z.ZodString>;
            completedAt: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
        failures: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            status: z.ZodEnum<{
                pending: "pending";
                in_progress: "in_progress";
                success: "success";
                failure: "failure";
                skipped: "skipped";
            }>;
            conclusion: z.ZodNullable<z.ZodString>;
            url: z.ZodString;
            startedAt: z.ZodNullable<z.ZodString>;
            completedAt: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    feedback: z.ZodObject<{
        total: z.ZodNumber;
        unaddressed: z.ZodNumber;
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            author: z.ZodString;
            body: z.ZodString;
            path: z.ZodNullable<z.ZodString>;
            line: z.ZodNullable<z.ZodNumber>;
            severity: z.ZodEnum<{
                critical: "critical";
                high: "high";
                medium: "medium";
                low: "low";
                info: "info";
            }>;
            status: z.ZodEnum<{
                unaddressed: "unaddressed";
                addressed: "addressed";
                dismissed: "dismissed";
                wont_fix: "wont_fix";
            }>;
            createdAt: z.ZodString;
            url: z.ZodString;
            isAutoResolvable: z.ZodBoolean;
            suggestedAction: z.ZodNullable<z.ZodString>;
            resolution: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    blockers: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            ci_failure: "ci_failure";
            review_feedback: "review_feedback";
            merge_conflict: "merge_conflict";
            missing_approval: "missing_approval";
            branch_protection: "branch_protection";
            stale_branch: "stale_branch";
        }>;
        description: z.ZodString;
        isAutoResolvable: z.ZodBoolean;
        suggestedFix: z.ZodNullable<z.ZodString>;
        url: z.ZodNullable<z.ZodString>;
        resolved: z.ZodBoolean;
    }, z.core.$strip>>;
    nextActions: z.ZodArray<z.ZodObject<{
        action: z.ZodString;
        priority: z.ZodEnum<{
            critical: "critical";
            high: "high";
            medium: "medium";
            low: "low";
            info: "info";
        }>;
        automated: z.ZodBoolean;
        reason: z.ZodString;
    }, z.core.$strip>>;
    summary: z.ZodString;
    timestamp: z.ZodString;
}, z.core.$strip>;
/**
 * Complete triage result for a pull request.
 * Contains PR status, CI results, feedback, blockers, and recommended actions.
 */
export type TriageResult = z.infer<typeof TriageResultSchema>;
/**
 * Schema for the result of an automated action.
 */
export declare const ActionResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    action: z.ZodString;
    description: z.ZodString;
    error: z.ZodNullable<z.ZodString>;
    changes: z.ZodNullable<z.ZodArray<z.ZodObject<{
        file: z.ZodString;
        type: z.ZodEnum<{
            created: "created";
            modified: "modified";
            deleted: "deleted";
        }>;
    }, z.core.$strip>>>;
    commitSha: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * Result of an automated action.
 * Contains success status, description, and any file changes made.
 */
export type ActionResult = z.infer<typeof ActionResultSchema>;
/**
 * Schema for a resolution plan to address PR blockers.
 */
export declare const ResolutionPlanSchema: z.ZodObject<{
    prNumber: z.ZodNumber;
    steps: z.ZodArray<z.ZodObject<{
        order: z.ZodNumber;
        action: z.ZodString;
        description: z.ZodString;
        automated: z.ZodBoolean;
        estimatedDuration: z.ZodString;
        dependencies: z.ZodArray<z.ZodNumber>;
    }, z.core.$strip>>;
    estimatedTotalDuration: z.ZodString;
    requiresHumanIntervention: z.ZodBoolean;
    humanInterventionReason: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
/**
 * A plan to resolve PR blockers.
 * Contains ordered steps with dependencies and time estimates.
 */
export type ResolutionPlan = z.infer<typeof ResolutionPlanSchema>;
//# sourceMappingURL=types.d.ts.map