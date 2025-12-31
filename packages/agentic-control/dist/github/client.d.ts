/**
 * GitHubClient - Unified GitHub API client
 *
 * Provides GitHub API operations with:
 * - Intelligent token switching based on organization
 * - Consistent identity for PR reviews
 * - CI status and feedback collection
 * - Safe git operations (no shell injection)
 *
 * This consolidates the former token-aware client and triage client.
 */
import { Octokit } from '@octokit/rest';
import type { PRComment, PullRequest, Repository, Result } from '../core/types.js';
import type { CIStatus, FeedbackItem } from '../triage/types.js';
export interface GitHubClientConfig {
    /** Token for authentication */
    token?: string;
    /** Repository owner */
    owner?: string;
    /** Repository name */
    repo?: string;
}
export declare class GitHubClient {
    private token;
    private owner;
    private repo;
    /**
     * Create a new GitHubClient.
     *
     * Can be used in two modes:
     * 1. With explicit config: new GitHubClient({ token, owner, repo })
     * 2. Token-aware mode: new GitHubClient() - uses token based on repo
     */
    constructor(config?: GitHubClientConfig);
    /**
     * Get an Octokit instance for a repository.
     * Automatically selects the correct token based on org.
     */
    static forRepo(repoUrl: string): Octokit | null;
    /**
     * Get an Octokit instance for PR review operations.
     * Always uses the consistent PR review identity.
     */
    static forPRReview(): Octokit | null;
    private getOctokitInstance;
    private ensureRepo;
    /**
     * Get repository information
     */
    static getRepo(owner: string, repo: string): Promise<Result<Repository>>;
    /**
     * List repositories for an organization
     */
    static listOrgRepos(org: string, options?: {
        type?: 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member';
        perPage?: number;
    }): Promise<Result<Repository[]>>;
    /**
     * Get pull request information (static version)
     */
    static getPRStatic(owner: string, repo: string, prNumber: number): Promise<Result<PullRequest>>;
    /**
     * Get pull request (instance version with full data)
     */
    getPR(prNumber: number): Promise<{
        url: string;
        id: number;
        node_id: string;
        html_url: string;
        diff_url: string;
        patch_url: string;
        issue_url: string;
        commits_url: string;
        review_comments_url: string;
        review_comment_url: string;
        comments_url: string;
        statuses_url: string;
        number: number;
        state: "open" | "closed";
        locked: boolean;
        title: string;
        user: {
            name?: string | null;
            email?: string | null;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string;
            user_view_type?: string;
        };
        body: string | null;
        labels: {
            id: number;
            node_id: string;
            url: string;
            name: string;
            description: string | null;
            color: string;
            default: boolean;
        }[];
        milestone: {
            url: string;
            html_url: string;
            labels_url: string;
            id: number;
            node_id: string;
            number: number;
            state: "open" | "closed";
            title: string;
            description: string | null;
            creator: {
                name?: string | null;
                email?: string | null;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string;
                user_view_type?: string;
            } | null;
            open_issues: number;
            closed_issues: number;
            created_at: string;
            updated_at: string;
            closed_at: string | null;
            due_on: string | null;
        } | null;
        active_lock_reason?: string | null;
        created_at: string;
        updated_at: string;
        closed_at: string | null;
        merged_at: string | null;
        merge_commit_sha: string | null;
        assignee: {
            name?: string | null;
            email?: string | null;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string;
            user_view_type?: string;
        } | null;
        assignees?: {
            name?: string | null;
            email?: string | null;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string;
            user_view_type?: string;
        }[] | null;
        requested_reviewers?: {
            name?: string | null;
            email?: string | null;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string;
            user_view_type?: string;
        }[] | null;
        requested_teams?: {
            id: number;
            node_id: string;
            url: string;
            members_url: string;
            name: string;
            description: string | null;
            permission: string;
            privacy?: string;
            notification_setting?: string;
            html_url: string;
            repositories_url: string;
            slug: string;
            ldap_dn?: string;
            type: "enterprise" | "organization";
            organization_id?: number;
            enterprise_id?: number;
        }[] | null;
        head: {
            label: string;
            ref: string;
            repo: {
                id: number;
                node_id: string;
                name: string;
                full_name: string;
                license: {
                    key: string;
                    name: string;
                    url: string | null;
                    spdx_id: string | null;
                    node_id: string;
                    html_url?: string;
                } | null;
                forks: number;
                permissions?: {
                    admin: boolean;
                    pull: boolean;
                    triage?: boolean;
                    push: boolean;
                    maintain?: boolean;
                };
                owner: {
                    name?: string | null;
                    email?: string | null;
                    login: string;
                    id: number;
                    node_id: string;
                    avatar_url: string;
                    gravatar_id: string | null;
                    url: string;
                    html_url: string;
                    followers_url: string;
                    following_url: string;
                    gists_url: string;
                    starred_url: string;
                    subscriptions_url: string;
                    organizations_url: string;
                    repos_url: string;
                    events_url: string;
                    received_events_url: string;
                    type: string;
                    site_admin: boolean;
                    starred_at?: string;
                    user_view_type?: string;
                };
                private: boolean;
                html_url: string;
                description: string | null;
                fork: boolean;
                url: string;
                archive_url: string;
                assignees_url: string;
                blobs_url: string;
                branches_url: string;
                collaborators_url: string;
                comments_url: string;
                commits_url: string;
                compare_url: string;
                contents_url: string;
                contributors_url: string;
                deployments_url: string;
                downloads_url: string;
                events_url: string;
                forks_url: string;
                git_commits_url: string;
                git_refs_url: string;
                git_tags_url: string;
                git_url: string;
                issue_comment_url: string;
                issue_events_url: string;
                issues_url: string;
                keys_url: string;
                labels_url: string;
                languages_url: string;
                merges_url: string;
                milestones_url: string;
                notifications_url: string;
                pulls_url: string;
                releases_url: string;
                ssh_url: string;
                stargazers_url: string;
                statuses_url: string;
                subscribers_url: string;
                subscription_url: string;
                tags_url: string;
                teams_url: string;
                trees_url: string;
                clone_url: string;
                mirror_url: string | null;
                hooks_url: string;
                svn_url: string;
                homepage: string | null;
                language: string | null;
                forks_count: number;
                stargazers_count: number;
                watchers_count: number;
                size: number;
                default_branch: string;
                open_issues_count: number;
                is_template?: boolean;
                topics?: string[];
                has_issues: boolean;
                has_projects: boolean;
                has_wiki: boolean;
                has_pages: boolean;
                has_downloads: boolean;
                has_discussions?: boolean;
                archived: boolean;
                disabled: boolean;
                visibility?: string;
                pushed_at: string | null;
                created_at: string | null;
                updated_at: string | null;
                allow_rebase_merge?: boolean;
                temp_clone_token?: string;
                allow_squash_merge?: boolean;
                allow_auto_merge?: boolean;
                delete_branch_on_merge?: boolean;
                allow_update_branch?: boolean;
                use_squash_pr_title_as_default?: boolean;
                squash_merge_commit_title?: "PR_TITLE" | "COMMIT_OR_PR_TITLE";
                squash_merge_commit_message?: "PR_BODY" | "COMMIT_MESSAGES" | "BLANK";
                merge_commit_title?: "PR_TITLE" | "MERGE_MESSAGE";
                merge_commit_message?: "PR_BODY" | "PR_TITLE" | "BLANK";
                allow_merge_commit?: boolean;
                allow_forking?: boolean;
                web_commit_signoff_required?: boolean;
                open_issues: number;
                watchers: number;
                master_branch?: string;
                starred_at?: string;
                anonymous_access_enabled?: boolean;
                code_search_index_status?: {
                    lexical_search_ok?: boolean;
                    lexical_commit_sha?: string;
                };
            };
            sha: string;
            user: {
                name?: string | null;
                email?: string | null;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string;
                user_view_type?: string;
            };
        };
        base: {
            label: string;
            ref: string;
            repo: {
                id: number;
                node_id: string;
                name: string;
                full_name: string;
                license: {
                    key: string;
                    name: string;
                    url: string | null;
                    spdx_id: string | null;
                    node_id: string;
                    html_url?: string;
                } | null;
                forks: number;
                permissions?: {
                    admin: boolean;
                    pull: boolean;
                    triage?: boolean;
                    push: boolean;
                    maintain?: boolean;
                };
                owner: {
                    name?: string | null;
                    email?: string | null;
                    login: string;
                    id: number;
                    node_id: string;
                    avatar_url: string;
                    gravatar_id: string | null;
                    url: string;
                    html_url: string;
                    followers_url: string;
                    following_url: string;
                    gists_url: string;
                    starred_url: string;
                    subscriptions_url: string;
                    organizations_url: string;
                    repos_url: string;
                    events_url: string;
                    received_events_url: string;
                    type: string;
                    site_admin: boolean;
                    starred_at?: string;
                    user_view_type?: string;
                };
                private: boolean;
                html_url: string;
                description: string | null;
                fork: boolean;
                url: string;
                archive_url: string;
                assignees_url: string;
                blobs_url: string;
                branches_url: string;
                collaborators_url: string;
                comments_url: string;
                commits_url: string;
                compare_url: string;
                contents_url: string;
                contributors_url: string;
                deployments_url: string;
                downloads_url: string;
                events_url: string;
                forks_url: string;
                git_commits_url: string;
                git_refs_url: string;
                git_tags_url: string;
                git_url: string;
                issue_comment_url: string;
                issue_events_url: string;
                issues_url: string;
                keys_url: string;
                labels_url: string;
                languages_url: string;
                merges_url: string;
                milestones_url: string;
                notifications_url: string;
                pulls_url: string;
                releases_url: string;
                ssh_url: string;
                stargazers_url: string;
                statuses_url: string;
                subscribers_url: string;
                subscription_url: string;
                tags_url: string;
                teams_url: string;
                trees_url: string;
                clone_url: string;
                mirror_url: string | null;
                hooks_url: string;
                svn_url: string;
                homepage: string | null;
                language: string | null;
                forks_count: number;
                stargazers_count: number;
                watchers_count: number;
                size: number;
                default_branch: string;
                open_issues_count: number;
                is_template?: boolean;
                topics?: string[];
                has_issues: boolean;
                has_projects: boolean;
                has_wiki: boolean;
                has_pages: boolean;
                has_downloads: boolean;
                has_discussions?: boolean;
                archived: boolean;
                disabled: boolean;
                visibility?: string;
                pushed_at: string | null;
                created_at: string | null;
                updated_at: string | null;
                allow_rebase_merge?: boolean;
                temp_clone_token?: string;
                allow_squash_merge?: boolean;
                allow_auto_merge?: boolean;
                delete_branch_on_merge?: boolean;
                allow_update_branch?: boolean;
                use_squash_pr_title_as_default?: boolean;
                squash_merge_commit_title?: "PR_TITLE" | "COMMIT_OR_PR_TITLE";
                squash_merge_commit_message?: "PR_BODY" | "COMMIT_MESSAGES" | "BLANK";
                merge_commit_title?: "PR_TITLE" | "MERGE_MESSAGE";
                merge_commit_message?: "PR_BODY" | "PR_TITLE" | "BLANK";
                allow_merge_commit?: boolean;
                allow_forking?: boolean;
                web_commit_signoff_required?: boolean;
                open_issues: number;
                watchers: number;
                master_branch?: string;
                starred_at?: string;
                anonymous_access_enabled?: boolean;
                code_search_index_status?: {
                    lexical_search_ok?: boolean;
                    lexical_commit_sha?: string;
                };
            };
            sha: string;
            user: {
                name?: string | null;
                email?: string | null;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string;
                user_view_type?: string;
            };
        };
        _links: {
            comments: {
                href: string;
            };
            commits: {
                href: string;
            };
            statuses: {
                href: string;
            };
            html: {
                href: string;
            };
            issue: {
                href: string;
            };
            review_comments: {
                href: string;
            };
            review_comment: {
                href: string;
            };
            self: {
                href: string;
            };
        };
        author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MANNEQUIN" | "MEMBER" | "NONE" | "OWNER";
        auto_merge: {
            enabled_by: {
                name?: string | null;
                email?: string | null;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string;
                user_view_type?: string;
            };
            merge_method: "merge" | "squash" | "rebase";
            commit_title: string;
            commit_message: string;
        } | null;
        draft?: boolean;
        merged: boolean;
        mergeable: boolean | null;
        rebaseable?: boolean | null;
        mergeable_state: string;
        merged_by: {
            name?: string | null;
            email?: string | null;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string;
            user_view_type?: string;
        } | null;
        comments: number;
        review_comments: number;
        maintainer_can_modify: boolean;
        commits: number;
        additions: number;
        deletions: number;
        changed_files: number;
    }>;
    /**
     * Get files changed in a PR
     */
    getPRFiles(prNumber: number): Promise<{
        sha: string | null;
        filename: string;
        status: "added" | "removed" | "modified" | "renamed" | "copied" | "changed" | "unchanged";
        additions: number;
        deletions: number;
        changes: number;
        blob_url: string;
        raw_url: string;
        contents_url: string;
        patch?: string;
        previous_filename?: string;
    }[]>;
    /**
     * Create a pull request
     */
    static createPR(owner: string, repo: string, options: {
        title: string;
        body?: string;
        head: string;
        base: string;
        draft?: boolean;
    }): Promise<Result<PullRequest>>;
    /**
     * Merge a pull request
     */
    static mergePRStatic(owner: string, repo: string, prNumber: number, options?: {
        mergeMethod?: 'merge' | 'squash' | 'rebase';
        commitTitle?: string;
        commitMessage?: string;
    }): Promise<Result<void>>;
    /**
     * Merge a pull request (instance version)
     */
    mergePR(prNumber: number, method?: 'merge' | 'squash' | 'rebase'): Promise<{
        sha: string;
        merged: boolean;
        message: string;
    }>;
    /**
     * Get reviews on a PR
     */
    getReviews(prNumber: number): Promise<{
        id: number;
        node_id: string;
        user: {
            name?: string | null;
            email?: string | null;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string;
            user_view_type?: string;
        } | null;
        body: string;
        state: string;
        html_url: string;
        pull_request_url: string;
        _links: {
            html: {
                href: string;
            };
            pull_request: {
                href: string;
            };
        };
        submitted_at?: string;
        commit_id: string | null;
        body_html?: string;
        body_text?: string;
        author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MANNEQUIN" | "MEMBER" | "NONE" | "OWNER";
    }[]>;
    /**
     * Get review comments on a PR
     */
    getReviewComments(prNumber: number): Promise<{
        url: string;
        pull_request_review_id: number | null;
        id: number;
        node_id: string;
        diff_hunk: string;
        path: string;
        position?: number;
        original_position?: number;
        commit_id: string;
        original_commit_id: string;
        in_reply_to_id?: number;
        user: {
            name?: string | null;
            email?: string | null;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string;
            user_view_type?: string;
        };
        body: string;
        created_at: string;
        updated_at: string;
        html_url: string;
        pull_request_url: string;
        author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MANNEQUIN" | "MEMBER" | "NONE" | "OWNER";
        _links: {
            self: {
                href: string;
            };
            html: {
                href: string;
            };
            pull_request: {
                href: string;
            };
        };
        start_line?: number | null;
        original_start_line?: number | null;
        start_side?: "LEFT" | "RIGHT" | null;
        line?: number;
        original_line?: number;
        side?: "LEFT" | "RIGHT";
        subject_type?: "line" | "file";
        reactions?: {
            url: string;
            total_count: number;
            "+1": number;
            "-1": number;
            laugh: number;
            confused: number;
            heart: number;
            hooray: number;
            eyes: number;
            rocket: number;
        };
        body_html?: string;
        body_text?: string;
    }[]>;
    /**
     * Get issue comments on a PR
     */
    getIssueComments(prNumber: number): Promise<{
        id: number;
        node_id: string;
        url: string;
        body?: string;
        body_text?: string;
        body_html?: string;
        html_url: string;
        user: {
            name?: string | null;
            email?: string | null;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string;
            user_view_type?: string;
        } | null;
        created_at: string;
        updated_at: string;
        issue_url: string;
        author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MANNEQUIN" | "MEMBER" | "NONE" | "OWNER";
        performed_via_github_app?: {
            id: number;
            slug?: string;
            node_id: string;
            client_id?: string;
            owner: {
                name?: string | null;
                email?: string | null;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string;
                user_view_type?: string;
            } | {
                description?: string | null;
                html_url: string;
                website_url?: string | null;
                id: number;
                node_id: string;
                name: string;
                slug: string;
                created_at: string | null;
                updated_at: string | null;
                avatar_url: string;
            };
            name: string;
            description: string | null;
            external_url: string;
            html_url: string;
            created_at: string;
            updated_at: string;
            permissions: {
                issues?: string;
                checks?: string;
                metadata?: string;
                contents?: string;
                deployments?: string;
                [key: string]: string | undefined;
            };
            events: string[];
            installations_count?: number;
        } | null;
        reactions?: {
            url: string;
            total_count: number;
            "+1": number;
            "-1": number;
            laugh: number;
            confused: number;
            heart: number;
            hooray: number;
            eyes: number;
            rocket: number;
        };
    }[]>;
    /**
     * List PR comments (static version)
     */
    static listPRComments(owner: string, repo: string, prNumber: number): Promise<Result<PRComment[]>>;
    /**
     * Post a PR comment (ALWAYS uses PR review identity)
     */
    static postPRComment(owner: string, repo: string, prNumber: number, body: string): Promise<Result<PRComment>>;
    /**
     * Post a comment (instance version)
     */
    postComment(prNumber: number, body: string): Promise<{
        id: number;
        node_id: string;
        url: string;
        body?: string;
        body_text?: string;
        body_html?: string;
        html_url: string;
        user: {
            name?: string | null;
            email?: string | null;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string;
            user_view_type?: string;
        } | null;
        created_at: string;
        updated_at: string;
        issue_url: string;
        author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MANNEQUIN" | "MEMBER" | "NONE" | "OWNER";
        performed_via_github_app?: {
            id: number;
            slug?: string;
            node_id: string;
            client_id?: string;
            owner: {
                name?: string | null;
                email?: string | null;
                login: string;
                id: number;
                node_id: string;
                avatar_url: string;
                gravatar_id: string | null;
                url: string;
                html_url: string;
                followers_url: string;
                following_url: string;
                gists_url: string;
                starred_url: string;
                subscriptions_url: string;
                organizations_url: string;
                repos_url: string;
                events_url: string;
                received_events_url: string;
                type: string;
                site_admin: boolean;
                starred_at?: string;
                user_view_type?: string;
            } | {
                description?: string | null;
                html_url: string;
                website_url?: string | null;
                id: number;
                node_id: string;
                name: string;
                slug: string;
                created_at: string | null;
                updated_at: string | null;
                avatar_url: string;
            };
            name: string;
            description: string | null;
            external_url: string;
            html_url: string;
            created_at: string;
            updated_at: string;
            permissions: {
                issues?: string;
                checks?: string;
                metadata?: string;
                contents?: string;
                deployments?: string;
                [key: string]: string | undefined;
            };
            events: string[];
            installations_count?: number;
        } | null;
        reactions?: {
            url: string;
            total_count: number;
            "+1": number;
            "-1": number;
            laugh: number;
            confused: number;
            heart: number;
            hooray: number;
            eyes: number;
            rocket: number;
        };
    }>;
    /**
     * Reply to a review comment
     */
    replyToComment(prNumber: number, commentId: number, body: string): Promise<{
        url: string;
        pull_request_review_id: number | null;
        id: number;
        node_id: string;
        diff_hunk: string;
        path: string;
        position?: number;
        original_position?: number;
        commit_id: string;
        original_commit_id: string;
        in_reply_to_id?: number;
        user: {
            name?: string | null;
            email?: string | null;
            login: string;
            id: number;
            node_id: string;
            avatar_url: string;
            gravatar_id: string | null;
            url: string;
            html_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            starred_url: string;
            subscriptions_url: string;
            organizations_url: string;
            repos_url: string;
            events_url: string;
            received_events_url: string;
            type: string;
            site_admin: boolean;
            starred_at?: string;
            user_view_type?: string;
        };
        body: string;
        created_at: string;
        updated_at: string;
        html_url: string;
        pull_request_url: string;
        author_association: "COLLABORATOR" | "CONTRIBUTOR" | "FIRST_TIMER" | "FIRST_TIME_CONTRIBUTOR" | "MANNEQUIN" | "MEMBER" | "NONE" | "OWNER";
        _links: {
            self: {
                href: string;
            };
            html: {
                href: string;
            };
            pull_request: {
                href: string;
            };
        };
        start_line?: number | null;
        original_start_line?: number | null;
        start_side?: "LEFT" | "RIGHT" | null;
        line?: number;
        original_line?: number;
        side?: "LEFT" | "RIGHT";
        subject_type?: "line" | "file";
        reactions?: {
            url: string;
            total_count: number;
            "+1": number;
            "-1": number;
            laugh: number;
            confused: number;
            heart: number;
            hooray: number;
            eyes: number;
            rocket: number;
        };
        body_html?: string;
        body_text?: string;
    }>;
    /**
     * Request a review on a PR (ALWAYS uses PR review identity)
     */
    static requestReview(owner: string, repo: string, prNumber: number, reviewers: string[]): Promise<Result<void>>;
    /**
     * Get CI status for a PR
     */
    getCIStatus(prNumber: number): Promise<CIStatus>;
    private mapCheckStatus;
    /**
     * Collect all feedback on a PR
     */
    collectFeedback(prNumber: number): Promise<FeedbackItem[]>;
    private inferSeverity;
    private inferStatus;
    private isAutoResolvable;
    private extractSuggestion;
}
/**
 * Clone a repository with appropriate token.
 * Uses spawnSync for safe command execution (no shell injection).
 */
export declare function cloneRepo(repoUrl: string, destPath: string): Result<void>;
/**
 * Validate a git ref/branch name to prevent injection
 */
export declare function isValidGitRef(ref: string): boolean;
/**
 * Validate owner/repo format
 */
export declare function isValidRepoFormat(repo: string): boolean;
export type { GitHubClientConfig as GitHubConfig };
//# sourceMappingURL=client.d.ts.map