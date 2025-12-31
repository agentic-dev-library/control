import { describe, expect, it } from 'vitest';
import {
    formatForAI,
    getFailedTests,
    getLowCoverageFiles,
    getTestsByFile,
    getUncoveredFunctions,
    parseTestReport,
    type TestReport,
} from '../src/test-results.ts';

describe('test-results', () => {
    const baseReport: TestReport = {
        version: '1.0',
        timestamp: new Date('2025-01-01T00:00:00Z').toISOString(),
        runner: 'vitest',
        type: 'unit',
        summary: { total: 3, passed: 2, failed: 1, skipped: 0, duration: 1234 },
        files: [
            {
                path: 'src/foo.test.ts',
                duration: 100,
                tests: [
                    {
                        id: 't1',
                        name: 'passes',
                        fullName: 'suite passes',
                        file: 'src/foo.test.ts',
                        status: 'passed',
                        duration: 10,
                    },
                    {
                        id: 't2',
                        name: 'fails',
                        fullName: 'suite fails',
                        file: 'src/foo.test.ts',
                        line: 12,
                        status: 'failed',
                        duration: 20,
                        error: {
                            message: 'boom',
                            codeFrame: '12 | throw new Error()',
                            diff: '-expected\n+actual',
                        },
                    },
                ],
            },
            {
                path: '/abs/path/bar.test.ts',
                duration: 50,
                tests: [
                    {
                        id: 't3',
                        name: 'skipped',
                        fullName: 'other skipped',
                        file: '/abs/path/bar.test.ts',
                        status: 'skipped',
                        duration: 0,
                    },
                ],
            },
        ],
        coverage: {
            lines: { total: 100, covered: 80, percentage: 80 },
            functions: { total: 10, covered: 7, percentage: 70 },
            branches: { total: 20, covered: 15, percentage: 75 },
            statements: { total: 100, covered: 80, percentage: 80 },
            files: [
                {
                    path: 'src/a.ts',
                    lines: { total: 10, covered: 7, percentage: 70 },
                    uncoveredLines: [1, 2, 3],
                    functions: { total: 2, covered: 1, percentage: 50 },
                    uncoveredFunctions: ['fnA'],
                },
                {
                    path: 'src/b.ts',
                    lines: { total: 10, covered: 9, percentage: 90 },
                    uncoveredLines: [],
                    functions: { total: 2, covered: 2, percentage: 100 },
                    uncoveredFunctions: [],
                },
            ],
        },
        git: { branch: 'main', commit: 'abc123', message: 'feat: test' },
        ci: { provider: 'github-actions', runId: '1' },
    };

    it('parseTestReport throws on unsupported version', () => {
        expect(() => parseTestReport(JSON.stringify({ version: '2.0' }))).toThrow(/Unsupported report version/);
    });

    it('parseTestReport returns typed data for version 1.0', () => {
        const parsed = parseTestReport(JSON.stringify(baseReport));
        expect(parsed.version).toBe('1.0');
        expect(parsed.files).toHaveLength(2);
    });

    it('getFailedTests returns failed tests across files', () => {
        const failed = getFailedTests(baseReport);
        expect(failed).toHaveLength(1);
        expect(failed[0].id).toBe('t2');
    });

    it('getTestsByFile matches exact path and suffix', () => {
        expect(getTestsByFile(baseReport, 'src/foo.test.ts')).toHaveLength(2);
        expect(getTestsByFile(baseReport, 'bar.test.ts')).toHaveLength(1);
        expect(getTestsByFile(baseReport, 'nope.test.ts')).toHaveLength(0);
    });

    it('getLowCoverageFiles respects threshold', () => {
        expect(getLowCoverageFiles(baseReport, 80).map((f) => f.path)).toEqual(['src/a.ts']);
        expect(getLowCoverageFiles(baseReport, 60).map((f) => f.path)).toEqual([]);
    });

    it('getUncoveredFunctions returns file/function pairs', () => {
        expect(getUncoveredFunctions(baseReport)).toEqual([{ file: 'src/a.ts', functions: ['fnA'] }]);
    });

    it('formatForAI renders failures and coverage', () => {
        const out = formatForAI(baseReport);
        expect(out).toContain('# Test Report (vitest - unit)');
        expect(out).toContain('## Summary');
        expect(out).toContain('## Failed Tests');
        expect(out).toContain('### suite fails');
        expect(out).toContain('File: src/foo.test.ts:12');
        expect(out).toContain('boom');
        expect(out).toContain('```diff');
        expect(out).toContain('## Coverage');
        expect(out).toContain('### Low Coverage Files (<80%)');
        expect(out).toContain('src/a.ts: 70.0%');
    });
});
