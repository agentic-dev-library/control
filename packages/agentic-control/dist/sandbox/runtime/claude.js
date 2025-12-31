/**
 * Claude runtime adapter for sandbox execution
 */
export class ClaudeRuntime {
    name = 'claude';
    image = 'jbcom/agentic-control:latest';
    prepareCommand(prompt, options) {
        const command = ['npx', '@anthropic-ai/claude-agent-sdk', 'query', '--prompt', prompt];
        if (options.timeout) {
            command.push('--timeout', options.timeout.toString());
        }
        return command;
    }
    parseOutput(stdout, stderr) {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(stdout);
            return {
                result: parsed.result || stdout,
                files: parsed.files || [],
                error: stderr || parsed.error,
            };
        }
        catch {
            // Fallback to plain text
            return {
                result: stdout,
                files: [],
                error: stderr,
            };
        }
    }
    async validateEnvironment() {
        return !!process.env.ANTHROPIC_API_KEY;
    }
}
//# sourceMappingURL=claude.js.map