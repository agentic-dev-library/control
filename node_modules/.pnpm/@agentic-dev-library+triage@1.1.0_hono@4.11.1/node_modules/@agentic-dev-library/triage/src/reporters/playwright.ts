/**
 * Playwright Reporter for Strata Triage
 *
 * Generates test reports in Strata's custom format for AI analysis.
 *
 * Usage in playwright.config.ts:
 * ```ts
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   reporter: [
 *     ['html'],
 *     ['@strata/triage/reporters/playwright', { outputFile: './test-results/e2e-report.json' }],
 *   ],
 * });
 * ```
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type {
    FullConfig,
    FullResult,
    TestResult as PWTestResult,
    Reporter,
    Suite,
    TestCase,
} from '@playwright/test/reporter';
import type { TestError, TestFile, TestReport, TestResult } from '../test-results.js';

export interface StrataPlaywrightReporterOptions {
    /** Output file path */
    outputFile?: string;
}

class StrataPlaywrightReporter implements Reporter {
    private options: Required<StrataPlaywrightReporterOptions>;
    private testResults: Map<string, TestResult[]> = new Map();

    constructor(options: StrataPlaywrightReporterOptions = {}) {
        this.options = {
            outputFile: options.outputFile ?? './test-results/strata-e2e-report.json',
        };
    }

    onBegin(_config: FullConfig, _suite: Suite): void {
        this.testResults.clear();
    }

    onTestEnd(test: TestCase, result: PWTestResult): void {
        const filePath = test.location.file;

        if (!this.testResults.has(filePath)) {
            this.testResults.set(filePath, []);
        }

        const testResult: TestResult = {
            id: test.id,
            name: test.title,
            fullName: test.titlePath().join(' > '),
            file: filePath,
            line: test.location.line,
            status: this.mapStatus(result.status),
            duration: result.duration,
            retry: result.retry,
            tags: test.tags,
        };

        // Process errors
        if (result.status === 'failed' && result.errors.length > 0) {
            testResult.error = this.processError(result.errors[0]);
        }

        this.testResults.get(filePath)?.push(testResult);
    }

    async onEnd(result: FullResult): Promise<void> {
        const report = this.buildReport(result);

        const outputPath = resolve(this.options.outputFile);
        mkdirSync(dirname(outputPath), { recursive: true });
        writeFileSync(outputPath, JSON.stringify(report, null, 2));

        console.log(`\n📊 Strata E2E report: ${outputPath}`);
    }

    private buildReport(result: FullResult): TestReport {
        const files: TestFile[] = [];

        for (const [filePath, tests] of this.testResults) {
            files.push({
                path: filePath,
                tests,
                duration: tests.reduce((sum, t) => sum + t.duration, 0),
            });
        }

        const allTests = files.flatMap((f) => f.tests);

        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            runner: 'playwright',
            type: 'e2e',
            summary: {
                total: allTests.length,
                passed: allTests.filter((t) => t.status === 'passed').length,
                failed: allTests.filter((t) => t.status === 'failed').length,
                skipped: allTests.filter((t) => t.status === 'skipped').length,
                duration: result.duration,
            },
            files,
            git: this.getGitContext(),
            ci: this.getCIContext(),
        };
    }

    private mapStatus(status: string): TestResult['status'] {
        switch (status) {
            case 'passed':
                return 'passed';
            case 'failed':
            case 'timedOut':
                return 'failed';
            case 'skipped':
                return 'skipped';
            default:
                return 'skipped';
        }
    }

    private processError(error: { message?: string; stack?: string }): TestError {
        return {
            message: error.message ?? 'Unknown error',
            stack: error.stack,
        };
    }

    private getGitContext(): TestReport['git'] | undefined {
        try {
            return {
                branch: execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf-8' }).trim(),
                commit: execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf-8' }).trim(),
                message: execFileSync('git', ['log', '-1', '--pretty=%s'], { encoding: 'utf-8' }).trim(),
            };
        } catch {
            return undefined;
        }
    }

    private getCIContext(): TestReport['ci'] | undefined {
        if (process.env.GITHUB_ACTIONS) {
            const prNumber = process.env.GITHUB_REF?.match(/refs\/pull\/(\d+)/)?.[1];
            return {
                provider: 'github-actions',
                runId: process.env.GITHUB_RUN_ID ?? '',
                runUrl: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
                prNumber: prNumber ? parseInt(prNumber, 10) : undefined,
            };
        }
        return undefined;
    }
}

export default StrataPlaywrightReporter;
