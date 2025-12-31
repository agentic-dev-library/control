/**
 * Cursor runtime adapter for sandbox execution
 */
export class CursorRuntime {
    name = 'cursor';
    image = 'jbcom/agentic-control:latest';
    prepareCommand(prompt, options) {
        const command = ['cursor-agent', 'run', '--task', prompt];
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
        return !!process.env.CURSOR_API_KEY;
    }
}
//# sourceMappingURL=cursor.js.map