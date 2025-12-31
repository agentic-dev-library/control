import { execFileSync, spawnSync } from 'node:child_process';

export interface Issue {
    number: number;
    title: string;
    body: string;
    labels: string[];
    state: string;
}

export interface PullRequest {
    number: number;
    title: string;
    body: string;
    diff: string;
    files: string[];
}

/**
 * Get environment with GitHub token
 */
function getGitHubEnv(): NodeJS.ProcessEnv {
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    return token ? { ...process.env, GH_TOKEN: token } : { ...process.env };
}

/**
 * Run gh CLI command safely using execFileSync
 */
function gh(args: string[]): string {
    return execFileSync('gh', args, {
        encoding: 'utf-8',
        env: getGitHubEnv(),
        maxBuffer: 10 * 1024 * 1024, // 10MB for large diffs
    })
        .toString()
        .trim();
}

/**
 * Run gh CLI command with stdin input
 */
function ghWithInput(args: string[], input: string): string {
    const result = spawnSync('gh', args, {
        input,
        encoding: 'utf-8',
        env: getGitHubEnv(),
        maxBuffer: 10 * 1024 * 1024,
    });

    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        throw new Error(result.stderr || `gh command failed with status ${result.status}`);
    }
    return result.stdout.trim();
}

/**
 * Run git command safely using execFileSync
 */
function git(args: string[]): string {
    return execFileSync('git', args, {
        encoding: 'utf-8',
    })
        .toString()
        .trim();
}

export function getIssue(issueNumber: number): Issue {
    const json = gh(['issue', 'view', String(issueNumber), '--json', 'number,title,body,labels,state']);
    const data = JSON.parse(json);
    return {
        number: data.number,
        title: data.title,
        body: data.body || '',
        labels: data.labels?.map((l: { name: string }) => l.name) || [],
        state: data.state,
    };
}

export function getPullRequest(prNumber: number): PullRequest {
    const json = gh(['pr', 'view', String(prNumber), '--json', 'number,title,body,files']);
    const data = JSON.parse(json);

    // Get the diff separately
    let diff = '';
    try {
        diff = gh(['pr', 'diff', String(prNumber)]);
    } catch {
        // Diff might fail for large PRs
    }

    return {
        number: data.number,
        title: data.title,
        body: data.body || '',
        diff,
        files: data.files?.map((f: { path: string }) => f.path) || [],
    };
}

export function addLabels(issueNumber: number, labels: string[]): void {
    if (labels.length === 0) return;
    // Pass labels as comma-separated without shell quoting
    gh(['issue', 'edit', String(issueNumber), '--add-label', labels.join(',')]);
}

export function removeLabels(issueNumber: number, labels: string[]): void {
    if (labels.length === 0) return;
    gh(['issue', 'edit', String(issueNumber), '--remove-label', labels.join(',')]);
}

export function commentOnIssue(issueNumber: number, body: string): void {
    ghWithInput(['issue', 'comment', String(issueNumber), '--body-file', '-'], body);
}

export function commentOnPR(prNumber: number, body: string): void {
    ghWithInput(['pr', 'comment', String(prNumber), '--body-file', '-'], body);
}

// Validate branch name to prevent command injection via --upload-pack etc
function validateBranchName(name: string): string {
    if (name.startsWith('-')) {
        throw new Error(`Invalid branch name: ${name}`);
    }
    return name;
}

export function createBranch(branchName: string, baseBranch = 'main'): void {
    const safeBranch = validateBranchName(baseBranch);
    const safeName = validateBranchName(branchName);
    git(['fetch', 'origin', '--', safeBranch]);
    git(['checkout', '-b', safeName, `origin/${safeBranch}`]);
}

export function pushBranch(branchName: string): void {
    const safeName = validateBranchName(branchName);
    git(['push', '-u', 'origin', '--', safeName]);
}

export function createPR(title: string, body: string, baseBranch = 'main'): number {
    const safeBranch = validateBranchName(baseBranch);
    const output = ghWithInput(
        ['pr', 'create', '--title', title, '--body-file', '-', '--base', safeBranch, '--json', 'number'],
        body
    );
    return JSON.parse(output).number;
}

export function getDefaultBranch(): string {
    const json = gh(['repo', 'view', '--json', 'defaultBranchRef']);
    return JSON.parse(json).defaultBranchRef.name;
}

export interface RepoInfo {
    owner: string;
    repo: string;
}

export function getRepoInfo(): RepoInfo {
    const json = gh(['repo', 'view', '--json', 'owner,name']);
    const data = JSON.parse(json);
    return {
        owner: data.owner.login,
        repo: data.name,
    };
}
