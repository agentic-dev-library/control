/**
 * Strata Test Results Format
 *
 * Custom test result format designed for AI-powered triage and diagnosis.
 * Used by both Vitest and Playwright reporters.
 */

export interface TestResult {
    /** Unique test identifier */
    id: string;
    /** Test name/title */
    name: string;
    /** Full test path (describe blocks) */
    fullName: string;
    /** Source file containing the test */
    file: string;
    /** Line number in source file */
    line?: number;
    /** Test status */
    status: 'passed' | 'failed' | 'skipped' | 'todo';
    /** Duration in milliseconds */
    duration: number;
    /** Error details if failed */
    error?: TestError;
    /** Retry attempt number */
    retry?: number;
    /** Tags/annotations */
    tags?: string[];
}

export interface TestError {
    /** Error message */
    message: string;
    /** Stack trace */
    stack?: string;
    /** Expected value (for assertion errors) */
    expected?: unknown;
    /** Actual value (for assertion errors) */
    actual?: unknown;
    /** Diff between expected and actual */
    diff?: string;
    /** Code snippet around the failure */
    codeFrame?: string;
}

export interface TestFile {
    /** File path */
    path: string;
    /** Tests in this file */
    tests: TestResult[];
    /** Setup/teardown errors */
    setupError?: TestError;
    /** File-level duration */
    duration: number;
}

export interface CoverageData {
    /** Total lines */
    lines: { total: number; covered: number; percentage: number };
    /** Total functions */
    functions: { total: number; covered: number; percentage: number };
    /** Total branches */
    branches: { total: number; covered: number; percentage: number };
    /** Total statements */
    statements: { total: number; covered: number; percentage: number };
    /** Per-file coverage */
    files: FileCoverage[];
}

export interface FileCoverage {
    /** File path */
    path: string;
    /** Line coverage */
    lines: { total: number; covered: number; percentage: number };
    /** Uncovered line numbers */
    uncoveredLines: number[];
    /** Function coverage */
    functions: { total: number; covered: number; percentage: number };
    /** Uncovered function names */
    uncoveredFunctions: string[];
}

export interface TestReport {
    /** Report format version */
    version: '1.0';
    /** Report generation timestamp */
    timestamp: string;
    /** Test runner (vitest, playwright, etc.) */
    runner: string;
    /** Test type */
    type: 'unit' | 'integration' | 'e2e';
    /** Summary statistics */
    summary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        duration: number;
    };
    /** Test files */
    files: TestFile[];
    /** Coverage data (if available) */
    coverage?: CoverageData;
    /** Git context */
    git?: {
        branch: string;
        commit: string;
        author?: string;
        message?: string;
    };
    /** CI context */
    ci?: {
        provider: string;
        runId: string;
        runUrl?: string;
        prNumber?: number;
        issueNumbers?: number[];
    };
}

/**
 * Parse test report from JSON file
 */
export function parseTestReport(json: string): TestReport {
    const data = JSON.parse(json);
    if (data.version !== '1.0') {
        throw new Error(`Unsupported report version: ${data.version}`);
    }
    return data as TestReport;
}

/**
 * Get failed tests from report
 */
export function getFailedTests(report: TestReport): TestResult[] {
    return report.files.flatMap((f) => f.tests.filter((t) => t.status === 'failed'));
}

/**
 * Get tests by file
 */
export function getTestsByFile(report: TestReport, filePath: string): TestResult[] {
    const file = report.files.find((f) => f.path === filePath || f.path.endsWith(filePath));
    return file?.tests ?? [];
}

/**
 * Get low coverage files
 */
export function getLowCoverageFiles(report: TestReport, threshold = 80): FileCoverage[] {
    if (!report.coverage) return [];
    return report.coverage.files.filter((f) => f.lines.percentage < threshold);
}

/**
 * Get uncovered functions
 */
export function getUncoveredFunctions(report: TestReport): { file: string; functions: string[] }[] {
    if (!report.coverage) return [];
    return report.coverage.files
        .filter((f) => f.uncoveredFunctions.length > 0)
        .map((f) => ({ file: f.path, functions: f.uncoveredFunctions }));
}

/**
 * Format test results for AI analysis
 */
export function formatForAI(report: TestReport): string {
    const lines: string[] = [];

    lines.push(`# Test Report (${report.runner} - ${report.type})`);
    lines.push(`Generated: ${report.timestamp}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push(`- Total: ${report.summary.total}`);
    lines.push(`- Passed: ${report.summary.passed} ✅`);
    lines.push(`- Failed: ${report.summary.failed} ❌`);
    lines.push(`- Skipped: ${report.summary.skipped} ⏭️`);
    lines.push(`- Duration: ${(report.summary.duration / 1000).toFixed(2)}s`);
    lines.push('');

    // Git context
    if (report.git) {
        formatGitContext(lines, report.git);
    }

    // Failed tests
    const failed = getFailedTests(report);
    if (failed.length > 0) {
        formatFailedTests(lines, failed);
    }

    // Coverage
    if (report.coverage) {
        formatCoverage(lines, report);
    }

    return lines.join('\n');
}

function formatGitContext(lines: string[], git: NonNullable<TestReport['git']>): void {
    lines.push('## Git Context');
    lines.push(`- Branch: ${git.branch}`);
    lines.push(`- Commit: ${git.commit}`);
    if (git.message) lines.push(`- Message: ${git.message}`);
    lines.push('');
}

function formatFailedTests(lines: string[], failed: TestResult[]): void {
    lines.push('## Failed Tests');
    for (const test of failed) {
        lines.push(`### ${test.fullName}`);
        lines.push(`- File: ${test.file}${test.line ? `:${test.line}` : ''}`);
        lines.push(`- Duration: ${test.duration}ms`);
        if (test.error) {
            formatTestError(lines, test.error);
        }
        lines.push('');
    }
}

function formatTestError(lines: string[], error: TestError): void {
    lines.push('');
    lines.push('**Error:**');
    lines.push('```');
    lines.push(error.message);
    if (error.codeFrame) {
        lines.push('');
        lines.push(error.codeFrame);
    }
    lines.push('```');
    if (error.diff) {
        lines.push('');
        lines.push('**Diff:**');
        lines.push('```diff');
        lines.push(error.diff);
        lines.push('```');
    }
}

function formatCoverage(lines: string[], report: TestReport): void {
    const coverage = report.coverage;
    if (!coverage) return;
    lines.push('## Coverage');
    lines.push(`- Lines: ${coverage.lines.percentage.toFixed(1)}%`);
    lines.push(`- Functions: ${coverage.functions.percentage.toFixed(1)}%`);
    lines.push(`- Branches: ${coverage.branches.percentage.toFixed(1)}%`);
    lines.push('');

    const lowCoverage = getLowCoverageFiles(report, 80);
    if (lowCoverage.length > 0) {
        lines.push('### Low Coverage Files (<80%)');
        for (const file of lowCoverage.slice(0, 10)) {
            lines.push(`- ${file.path}: ${file.lines.percentage.toFixed(1)}%`);
        }
        lines.push('');
    }
}
