/**
 * MCP (Model Context Protocol) Integration
 *
 * This module provides unified access to all MCP servers used by triage:
 *
 * | Server         | Purpose                                              |
 * |----------------|------------------------------------------------------|
 * | **Filesystem** | Read/write files - CRITICAL for Ollama's limited context |
 * | **GitHub**     | Issues, PRs, projects, commits - full GitHub API    |
 * | **Playwright** | Browser automation, E2E testing, visual verification |
 * | **Context7**   | Library documentation lookup - PREVENTS HALLUCINATIONS |
 * | **Vite React** | React component debugging, state inspection, render tracking |
 *
 * ## Key Design Principles
 *
 * 1. **Ollama has LIMITED context** - The AI MUST use filesystem tools to read
 *    file contents and write changes directly. We cannot fit entire codebases
 *    in the prompt.
 *
 * 2. **Context7 prevents hallucinations** - Instead of guessing API details,
 *    the AI can look up actual library documentation.
 *
 * 3. **Vite React MCP** - For debugging React apps during development/testing,
 *    can inspect component tree, props, state, and track unnecessary re-renders.
 *
 * 4. **GitHub MCP** - Full API access for issues, PRs, projects without
 *    needing to shell out to `gh` CLI.
 */

import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
import { generateText, stepCountIs } from 'ai';
import { resolveModel, type ToolSet } from './ai.js';

export type MCPClient = Awaited<ReturnType<typeof createMCPClient>>;

// =============================================================================
// FILESYSTEM MCP
// =============================================================================

/**
 * Create Filesystem MCP client for file operations
 *
 * Uses an inline server for reliability (no npx dependency).
 * This is the MOST IMPORTANT MCP - it lets the AI read and write files
 * since Ollama can't fit everything in context.
 */
export async function createFilesystemClient(workingDirectory: string): Promise<MCPClient> {
    return createInlineFilesystemClient(workingDirectory);
}

/**
 * Inline filesystem MCP server
 *
 * Provides: read_file, write_file, list_files, search_files
 * All paths are sandboxed to workingDirectory for security.
 */
export async function createInlineFilesystemClient(workingDirectory: string): Promise<MCPClient> {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const os = await import('node:os');

    const serverCode = `
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const BASE_DIR = ${JSON.stringify(workingDirectory)};

function resolvePath(relativePath) {
    const resolved = path.resolve(BASE_DIR, relativePath);
    if (!resolved.startsWith(BASE_DIR)) {
        throw new Error('Path traversal not allowed');
    }
    return resolved;
}

const tools = {
    read_file: {
        name: 'read_file',
        description: 'Read the contents of a file. Use this to examine source code, configs, or any text file. ESSENTIAL - use this instead of guessing file contents!',
        inputSchema: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path to the file relative to workspace root' }
            },
            required: ['path']
        }
    },
    write_file: {
        name: 'write_file',
        description: 'Write content to a file. Creates parent directories if needed. Use this to make actual code changes!',
        inputSchema: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path to the file relative to workspace root' },
                content: { type: 'string', description: 'Complete content to write to the file' }
            },
            required: ['path', 'content']
        }
    },
    list_files: {
        name: 'list_files',
        description: 'List files and directories in a path. Use to explore project structure.',
        inputSchema: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Directory path relative to workspace root', default: '.' }
            }
        }
    },
    search_files: {
        name: 'search_files',
        description: 'Search for files matching a glob pattern. Use to find relevant files quickly.',
        inputSchema: {
            type: 'object',
            properties: {
                pattern: { type: 'string', description: 'Glob pattern like *.ts or **/*.test.ts' },
                path: { type: 'string', description: 'Directory to search in', default: '.' }
            },
            required: ['pattern']
        }
    }
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.on('line', async (input) => {
    try {
        const request = JSON.parse(input);

        if (request.method === 'initialize') {
            console.log(JSON.stringify({
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    serverInfo: { name: 'strata-filesystem', version: '1.0.0' }
                }
            }));
            return;
        }

        if (request.method === 'notifications/initialized') return;

        if (request.method === 'tools/list') {
            console.log(JSON.stringify({
                jsonrpc: '2.0',
                id: request.id,
                result: { tools: Object.values(tools) }
            }));
            return;
        }

        if (request.method === 'tools/call') {
            const { name, arguments: args } = request.params;
            let result;

            try {
                switch (name) {
                    case 'read_file': {
                        const filePath = resolvePath(args.path);
                        const content = await fs.readFile(filePath, 'utf-8');
                        result = { content, path: args.path, lines: content.split('\\n').length };
                        break;
                    }
                    case 'write_file': {
                        const filePath = resolvePath(args.path);
                        await fs.mkdir(path.dirname(filePath), { recursive: true });
                        await fs.writeFile(filePath, args.content, 'utf-8');
                        result = { success: true, path: args.path, bytesWritten: args.content.length };
                        break;
                    }
                    case 'list_files': {
                        const dirPath = resolvePath(args.path || '.');
                        const entries = await fs.readdir(dirPath, { withFileTypes: true });
                        result = {
                            path: args.path || '.',
                            entries: entries.map(e => ({
                                name: e.name,
                                type: e.isDirectory() ? 'directory' : 'file'
                            }))
                        };
                        break;
                    }
                    case 'search_files': {
                        const searchDir = resolvePath(args.path || '.');
                        const pattern = args.pattern.replace(/\\*/g, '.*').replace(/\\?/g, '.');
                        const regex = new RegExp(pattern);
                        const matches = [];

                        async function walk(dir, depth = 0) {
                            if (depth > 10) return;
                            try {
                                const entries = await fs.readdir(dir, { withFileTypes: true });
                                for (const entry of entries) {
                                    const fullPath = path.join(dir, entry.name);
                                    const relativePath = path.relative(BASE_DIR, fullPath);
                                    if (entry.isDirectory()) {
                                        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                                            await walk(fullPath, depth + 1);
                                        }
                                    } else if (regex.test(entry.name) || regex.test(relativePath)) {
                                        matches.push(relativePath);
                                    }
                                }
                            } catch (e) { /* ignore */ }
                        }
                        await walk(searchDir);
                        result = { pattern: args.pattern, matches: matches.slice(0, 100) };
                        break;
                    }
                    default:
                        result = { error: 'Unknown tool: ' + name };
                }
            } catch (err) {
                result = { error: err.message };
            }

            console.log(JSON.stringify({
                jsonrpc: '2.0',
                id: request.id,
                result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
            }));
        }
    } catch (err) {
        console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -1, message: err.message }
        }));
    }
});
`;

    const serverPath = path.join(os.tmpdir(), `strata-fs-mcp-${Date.now()}.cjs`);
    await fs.writeFile(serverPath, serverCode);

    const transport = new StdioMCPTransport({
        command: 'node',
        args: [serverPath],
        cwd: workingDirectory,
    });

    return createMCPClient({ transport });
}

/**
 * Get filesystem tools from client
 */
export async function getFilesystemTools(client: MCPClient): Promise<ToolSet> {
    return client.tools();
}

// =============================================================================
// GITHUB MCP
// =============================================================================

/**
 * Create GitHub MCP client for issue/PR/project operations
 *
 * Provides access to:
 * - create_issue, update_issue, get_issue
 * - create_pull_request, merge_pull_request
 * - add_label, remove_label
 * - get_file_contents, create_or_update_file
 * - search_issues, search_repositories
 */
export async function createGitHubClient(): Promise<MCPClient> {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) {
        throw new Error('GITHUB_TOKEN or GH_TOKEN required for GitHub MCP');
    }

    const transport = new StdioMCPTransport({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
            ...process.env,
            GITHUB_PERSONAL_ACCESS_TOKEN: token,
        },
    });

    return createMCPClient({ transport });
}

/**
 * Get GitHub tools from client
 */
export async function getGitHubTools(client: MCPClient): Promise<ToolSet> {
    return client.tools();
}

// =============================================================================
// PLAYWRIGHT MCP
// =============================================================================

/**
 * Create Playwright MCP client for browser automation
 *
 * Used for E2E testing, visual verification, and user flow testing.
 *
 * Provides:
 * - browser_navigate, browser_click, browser_type
 * - browser_snapshot, browser_take_screenshot
 * - browser_verify_* (with testing capabilities)
 */
export async function createPlaywrightClient(
    options: {
        headless?: boolean;
        browser?: 'chromium' | 'firefox' | 'webkit';
        outputDir?: string;
        testingCapabilities?: boolean;
    } = {}
): Promise<MCPClient> {
    const { headless = true, browser = 'chromium', outputDir = './test-output', testingCapabilities = true } = options;

    const args = ['-y', '@playwright/mcp@latest'];

    if (headless) args.push('--headless');
    args.push('--browser', browser);
    args.push('--output-dir', outputDir);
    if (testingCapabilities) args.push('--caps=testing');

    const transport = new StdioMCPTransport({
        command: 'npx',
        args,
    });

    return createMCPClient({ transport });
}

/**
 * Get Playwright tools from client
 */
export async function getPlaywrightTools(client: MCPClient): Promise<ToolSet> {
    return client.tools();
}

// =============================================================================
// CONTEXT7 MCP - DOCUMENTATION LOOKUP (PREVENTS HALLUCINATIONS!)
// =============================================================================

/**
 * Create Context7 MCP client for library documentation lookup
 *
 * CRITICAL for preventing hallucinations!
 * Provides access to up-to-date library documentation so the AI can
 * reference-check instead of making up API details.
 *
 * Tools provided:
 * - resolve-library-id: Find Context7 library ID from name
 * - get-library-docs: Get documentation for a library
 *
 * Uses HTTP transport to Context7's cloud service.
 * Requires CONTEXT7_API_KEY environment variable.
 */
export async function createContext7Client(): Promise<MCPClient> {
    const apiKey = process.env.CONTEXT7_API_KEY;

    // Use HTTP transport to Context7's cloud service
    const client = await createMCPClient({
        transport: {
            type: 'http',
            url: 'https://mcp.context7.com/mcp',
            headers: apiKey ? { CONTEXT7_API_KEY: apiKey } : undefined,
        },
    });

    return client;
}

/**
 * Get Context7 tools from client
 *
 * Available tools:
 * - resolve-library-id: Resolve library name to Context7 ID
 * - get-library-docs: Get library documentation
 */
export async function getContext7Tools(client: MCPClient): Promise<ToolSet> {
    return client.tools();
}

// =============================================================================
// VITE REACT MCP - REACT COMPONENT DEBUGGING
// =============================================================================

/**
 * Create Vite React MCP client for React component debugging
 *
 * Connects to a running Vite dev server with the vite-react-mcp plugin.
 * Used for debugging React apps during development and testing.
 *
 * Tools provided:
 * - highlight-component: Highlight a React component by name
 * - get-component-states: Get props, states, and contexts
 * - get-component-tree: Get component tree in ASCII format
 * - get-unnecessary-rerenders: Track wasted renders
 *
 * Requires the app to be running with vite-react-mcp plugin installed.
 */
export async function createViteReactClient(
    options: {
        /** URL of the Vite dev server SSE endpoint (default: http://localhost:5173/sse) */
        url?: string;
        /** Port number (alternative to full URL) */
        port?: number;
    } = {}
): Promise<MCPClient> {
    const { port = 5173 } = options;
    const url = options.url || `http://localhost:${port}/sse`;

    const client = await createMCPClient({
        transport: {
            type: 'sse',
            url,
        },
    });

    return client;
}

/**
 * Get Vite React tools from client
 */
export async function getViteReactTools(client: MCPClient): Promise<ToolSet> {
    return client.tools();
}

// =============================================================================
// GRAPHQL MCP
// =============================================================================

/**
 * Create GraphQL MCP client for GitHub GraphQL API operations
 *
 * Uses mcp-graphql to execute GraphQL queries/mutations against GitHub's API.
 * Required for: Projects V2, review threads, draft PR conversion, auto-merge, etc.
 */
export async function createGraphQLClient(): Promise<MCPClient> {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) {
        throw new Error('GITHUB_TOKEN or GH_TOKEN required for GraphQL MCP');
    }

    // mcp-graphql v1.0.0+ uses environment variables instead of CLI args
    const transport = new StdioMCPTransport({
        command: 'npx',
        args: ['-y', 'mcp-graphql'],
        env: {
            ...process.env,
            ENDPOINT: 'https://api.github.com/graphql',
            HEADERS: JSON.stringify({
                Authorization: `Bearer ${token}`,
            }),
        },
    });

    return createMCPClient({
        transport,
        name: 'strata-triage-graphql',
        version: '1.0.0',
    });
}

/**
 * Get GraphQL tools from client
 */
export async function getGraphQLTools(client: MCPClient): Promise<ToolSet> {
    return client.tools();
}

// =============================================================================
// UNIFIED MCP ACCESS
// =============================================================================

export interface MCPClients {
    filesystem?: MCPClient;
    github?: MCPClient;
    playwright?: MCPClient;
    context7?: MCPClient;
    viteReact?: MCPClient;
    graphql?: MCPClient;
}

export interface MCPClientOptions {
    /** Enable filesystem access (required for most tasks) */
    filesystem?: boolean | string; // string = custom working directory

    /** Enable GitHub API access */
    github?: boolean;

    /** Enable Playwright browser automation */
    playwright?:
        | boolean
        | {
              headless?: boolean;
              browser?: 'chromium' | 'firefox' | 'webkit';
          };

    /** Enable Context7 documentation lookup (PREVENTS HALLUCINATIONS!) */
    context7?: boolean;

    /** Enable Vite React component debugging */
    viteReact?:
        | boolean
        | {
              url?: string;
              port?: number;
          };

    /** Enable GitHub GraphQL API access via mcp-graphql */
    graphql?: boolean;
}

/**
 * Initialize multiple MCP clients based on options
 *
 * @example
 * const clients = await initializeMCPClients({
 *     filesystem: process.cwd(),  // Required for file access
 *     context7: true,             // Documentation lookup - prevents hallucinations
 *     github: true,               // Issue/PR operations
 * });
 */
export async function initializeMCPClients(options: MCPClientOptions): Promise<MCPClients> {
    const clients: MCPClients = {};
    const initPromises: Promise<void>[] = [];

    if (options.filesystem) {
        const dir = typeof options.filesystem === 'string' ? options.filesystem : process.cwd();
        initPromises.push(
            createFilesystemClient(dir)
                .then((client) => {
                    clients.filesystem = client;
                })
                .catch((err) => console.warn('⚠️ Filesystem MCP unavailable:', err.message))
        );
    }

    if (options.github) {
        initPromises.push(
            createGitHubClient()
                .then((client) => {
                    clients.github = client;
                })
                .catch((err) => console.warn('⚠️ GitHub MCP unavailable:', err.message))
        );
    }

    if (options.playwright) {
        const playwrightOpts = typeof options.playwright === 'object' ? options.playwright : {};
        initPromises.push(
            createPlaywrightClient(playwrightOpts)
                .then((client) => {
                    clients.playwright = client;
                })
                .catch((err) => console.warn('⚠️ Playwright MCP unavailable:', err.message))
        );
    }

    if (options.context7) {
        initPromises.push(
            createContext7Client()
                .then((client) => {
                    clients.context7 = client;
                })
                .catch((err) => console.warn('⚠️ Context7 MCP unavailable:', err.message))
        );
    }

    if (options.viteReact) {
        const viteOpts = typeof options.viteReact === 'object' ? options.viteReact : {};
        initPromises.push(
            createViteReactClient(viteOpts)
                .then((client) => {
                    clients.viteReact = client;
                })
                .catch((err) => console.warn('⚠️ Vite React MCP unavailable:', err.message))
        );
    }

    if (options.graphql) {
        initPromises.push(
            createGraphQLClient()
                .then((client) => {
                    clients.graphql = client;
                })
                .catch((err) => console.warn('⚠️ GraphQL MCP unavailable:', err.message))
        );
    }

    await Promise.all(initPromises);
    return clients;
}

/**
 * Get combined tools from all active MCP clients
 *
 * Tools are available without prefixes for simpler prompts.
 */
export async function getAllTools(clients: MCPClients): Promise<ToolSet> {
    const allTools: ToolSet = {};
    const toolPromises: Promise<void>[] = [];

    for (const [name, client] of Object.entries(clients)) {
        if (client) {
            toolPromises.push(
                client
                    .tools()
                    .then((tools: ToolSet) => {
                        Object.assign(allTools, tools);
                    })
                    .catch((err: Error) => console.warn(`⚠️ Failed to get tools from ${name}:`, err.message))
            );
        }
    }

    await Promise.all(toolPromises);
    return allTools;
}

/**
 * Close all MCP clients - ALWAYS call this when done!
 */
export async function closeMCPClients(clients: MCPClients): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const client of Object.values(clients)) {
        if (client) {
            closePromises.push(client.close().catch(() => {}));
        }
    }

    await Promise.all(closePromises);
}

// =============================================================================
// AGENTIC TASK EXECUTION
// =============================================================================

export interface AgenticTaskOptions {
    /** System prompt defining the AI's role and behavior */
    systemPrompt: string;
    /** User prompt with the actual task */
    userPrompt: string;
    /** MCP clients to enable */
    mcpClients?: MCPClientOptions;
    /** Maximum steps for the agentic loop (default: 15) */
    maxSteps?: number;
    /** Callback for each tool call */
    onToolCall?: (toolName: string, args: unknown) => void;
    /** Callback for each step completion */
    onStepFinish?: (step: { text?: string; toolCalls?: unknown[] }) => void;
}

export interface AgenticTaskResult {
    /** Final text response from the AI */
    text: string;
    /** Total number of tool calls made */
    toolCallCount: number;
    /** All steps in the agentic loop */
    steps: unknown[];
    /** Reason the loop finished */
    finishReason: string;
}

/**
 * Run an agentic task with MCP tools
 *
 * This is the main entry point for AI tasks that need tool access.
 * Properly handles the agentic loop via AI SDK's stopWhen.
 *
 * @example
 * const result = await runAgenticTask({
 *     systemPrompt: 'You are a code reviewer...',
 *     userPrompt: 'Review this PR diff...',
 *     mcpClients: {
 *         filesystem: process.cwd(),  // Read files for context
 *         context7: true,              // Check documentation - prevents hallucinations
 *     },
 *     maxSteps: 15,
 *     onToolCall: (name, args) => console.log(`Using ${name}`),
 * });
 */
export async function runAgenticTask(options: AgenticTaskOptions): Promise<AgenticTaskResult> {
    const {
        systemPrompt,
        userPrompt,
        mcpClients: clientOptions = { filesystem: true },
        maxSteps = 15,
        onToolCall,
        onStepFinish,
    } = options;

    // Initialize MCP clients
    const clients = await initializeMCPClients(clientOptions);

    try {
        // Get all tools from all clients
        const tools = await getAllTools(clients);

        if (Object.keys(tools).length === 0) {
            throw new Error('No MCP tools available - check MCP server connections');
        }

        const resolved = await resolveModel();

        // Run the AI with multi-step tool support
        const result = await generateText({
            model: resolved.model,
            system: systemPrompt,
            prompt: userPrompt,
            tools,
            stopWhen: stepCountIs(maxSteps),
            onStepFinish: (step) => {
                // Track tool calls
                if (step.toolCalls && onToolCall) {
                    for (const call of step.toolCalls) {
                        // The Vercel AI SDK's ToolCall type uses a generic for the tool name
                        // and arguments, but MCP tools have dynamic tool names that can't be
                        // known at compile time. We cast to any to access toolName/input/args
                        // properties that exist at runtime but aren't in the generic type.
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const tc = call as any;
                        onToolCall(tc.toolName, tc.input || tc.args);
                    }
                }

                // User callback
                onStepFinish?.({
                    text: step.text,
                    toolCalls: step.toolCalls as unknown[],
                });
            },
        });

        // Count total tool calls across all steps
        const toolCallCount = result.steps?.reduce((acc, step) => acc + (step.toolCalls?.length || 0), 0) || 0;

        return {
            text: result.text,
            toolCallCount,
            steps: result.steps || [],
            finishReason: result.finishReason,
        };
    } finally {
        // ALWAYS close clients
        await closeMCPClients(clients);
    }
}

// =============================================================================
// EXPORTED CONSTANTS
// =============================================================================

/**
 * Playwright tool names for reference
 */
export const PLAYWRIGHT_TOOLS = {
    NAVIGATE: 'browser_navigate',
    CLICK: 'browser_click',
    TYPE: 'browser_type',
    SNAPSHOT: 'browser_snapshot',
    SCREENSHOT: 'browser_take_screenshot',
    CLOSE: 'browser_close',
    WAIT: 'browser_wait_for',
    EVALUATE: 'browser_evaluate',
    VERIFY_ELEMENT_VISIBLE: 'browser_verify_element_visible',
    VERIFY_TEXT_VISIBLE: 'browser_verify_text_visible',
    VERIFY_VALUE: 'browser_verify_value',
    GENERATE_LOCATOR: 'browser_generate_locator',
} as const;

/**
 * Filesystem tool names for reference
 */
export const FILESYSTEM_TOOLS = {
    READ_FILE: 'read_file',
    WRITE_FILE: 'write_file',
    LIST_FILES: 'list_files',
    SEARCH_FILES: 'search_files',
} as const;

/**
 * Context7 tool names for reference
 */
export const CONTEXT7_TOOLS = {
    /** Resolve library name to Context7 ID */
    RESOLVE_LIBRARY_ID: 'resolve-library-id',
    /** Get library documentation */
    GET_LIBRARY_DOCS: 'get-library-docs',
} as const;

/**
 * Vite React tool names for reference
 */
export const VITE_REACT_TOOLS = {
    /** Highlight a React component */
    HIGHLIGHT_COMPONENT: 'highlight-component',
    /** Get component props, states, contexts */
    GET_COMPONENT_STATES: 'get-component-states',
    /** Get component tree */
    GET_COMPONENT_TREE: 'get-component-tree',
    /** Get unnecessary re-renders */
    GET_UNNECESSARY_RERENDERS: 'get-unnecessary-rerenders',
} as const;

/**
 * GitHub MCP tool names for reference
 *
 * From @modelcontextprotocol/server-github
 */
export const GITHUB_TOOLS = {
    /** Post a comment on an issue or PR */
    ADD_ISSUE_COMMENT: 'add_issue_comment',
    /** Create a new issue */
    CREATE_ISSUE: 'create_issue',
    /** Get issue details */
    GET_ISSUE: 'get_issue',
    /** Update an issue */
    UPDATE_ISSUE: 'update_issue',
    /** Search issues */
    SEARCH_ISSUES: 'search_issues',
    /** Create a new pull request */
    CREATE_PULL_REQUEST: 'create_pull_request',
    /** Get pull request details */
    GET_PULL_REQUEST: 'get_pull_request',
    /** Get file contents from a repo */
    GET_FILE_CONTENTS: 'get_file_contents',
    /** Create or update a file */
    CREATE_OR_UPDATE_FILE: 'create_or_update_file',
    /** List commits */
    LIST_COMMITS: 'list_commits',
    /** Fork a repository */
    FORK_REPOSITORY: 'fork_repository',
    /** Create a branch */
    CREATE_BRANCH: 'create_branch',
} as const;
