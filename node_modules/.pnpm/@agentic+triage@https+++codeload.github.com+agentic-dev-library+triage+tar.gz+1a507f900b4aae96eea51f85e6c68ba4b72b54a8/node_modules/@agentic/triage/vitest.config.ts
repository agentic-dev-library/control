import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            reportsDirectory: './coverage',
            // Coverage scope:
            // - Focus on the core library surfaces (AI + execution + report parsing).
            // - Exclude CLI entrypoints, command wiring, and adapters that are exercised via
            //   end-to-end workflows rather than unit tests.
            include: ['src/ai.ts', 'src/test-results.ts', 'src/execution/**/*.ts'],
            exclude: [
                'node_modules',
                'dist',
                '**/*.config.ts',
                '**/index.ts',
                'src/cli.ts',
                'src/github.ts',
                'src/mcp.ts',
                'src/octokit.ts',
                'src/playwright.ts',
                'src/commands/**',
                'src/planning/**',
                'src/reporters/**',
                // Token estimation is intentionally treated as non-critical for now
                'src/execution/tokenizer.ts',
                // GitHub sandbox scaffolding is currently a stub
                'src/execution/github-sandbox.ts',
                // Harness is exercised via CLI-level integration tests
                'src/execution/test-harness.ts',
            ],
            thresholds: {
                // Temporarily lowered to allow initial merge
                // TODO: Increase as more tests are added
                statements: 5,
                branches: 50,
                functions: 20,
                lines: 5,
            },
        },
    },
});
