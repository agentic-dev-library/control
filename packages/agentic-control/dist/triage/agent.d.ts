/**
 * Agent - Unified AI-powered development agent
 *
 * A single, comprehensive agent that handles all agentic tasks:
 * - Code operations (bash, file editing, git)
 * - MCP integrations (Cursor, GitHub, Context7)
 * - Extended thinking/reasoning
 * - Web search
 * - Structured output
 * - Tool approval for sensitive operations
 *
 * This consolidates CodeAgent, EnhancedAgent, and UnifiedAgent into one class.
 */
import { z } from 'zod';
import { type MCPClientConfig } from './mcp-clients.js';
export interface AgentConfig {
    /** Working directory for file operations (sandbox root) */
    workingDirectory?: string;
    /** Maximum steps for multi-step tool calls */
    maxSteps?: number;
    /** MCP client configuration */
    mcp?: MCPClientConfig;
    /** Model to use */
    model?: 'claude-sonnet-4-20250514' | 'claude-opus-4-20250514' | string;
    /** Enable verbose logging */
    verbose?: boolean;
    /** Enable extended thinking/reasoning for complex tasks */
    reasoning?: {
        enabled: boolean;
        /** Token budget for thinking (default: 12000) */
        budgetTokens?: number;
    };
    /** Enable web search capability */
    webSearch?: {
        enabled: boolean;
        /** Max number of searches per request */
        maxUses?: number;
        /** Allowed domains for search */
        allowedDomains?: string[];
        /** Blocked domains */
        blockedDomains?: string[];
    };
    /** Tool approval settings */
    approval?: {
        /** Tools requiring approval before execution */
        requireApproval?: string[];
        /** Callback to handle approval requests */
        onApprovalRequest?: (toolName: string, input: unknown) => Promise<boolean>;
    };
}
export interface AgentResult {
    success: boolean;
    result: string;
    reasoning?: string;
    steps: AgentStep[];
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    };
}
export interface AgentStep {
    toolName: string;
    input: unknown;
    output: string;
    timestamp: Date;
    approved?: boolean;
}
export declare const TaskAnalysisSchema: z.ZodObject<{
    complexity: z.ZodEnum<{
        simple: "simple";
        moderate: "moderate";
        complex: "complex";
    }>;
    estimatedSteps: z.ZodNumber;
    requiresWebSearch: z.ZodBoolean;
    requiresReasoning: z.ZodBoolean;
    subtasks: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        priority: z.ZodEnum<{
            critical: "critical";
            high: "high";
            medium: "medium";
            low: "low";
        }>;
        tools: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    risks: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type TaskAnalysis = z.infer<typeof TaskAnalysisSchema>;
export declare class Agent {
    private config;
    private mcpClients;
    private initialized;
    /** Promise-based lock to prevent concurrent initialization race conditions */
    private initializationPromise;
    constructor(config?: AgentConfig);
    /**
     * Initialize MCP clients and prepare the agent.
     * Thread-safe: concurrent calls will wait for the same initialization to complete.
     */
    initialize(): Promise<void>;
    /**
     * Internal initialization logic - only called once due to promise lock
     */
    private doInitialize;
    /**
     * Close all connections and clean up
     */
    close(): Promise<void>;
    /**
     * Execute a task with full tool access
     */
    execute(task: string, options?: {
        enableReasoning?: boolean;
        enableWebSearch?: boolean;
    }): Promise<AgentResult>;
    /**
     * Execute a task with streaming output.
     * Note: Currently only yields text chunks. Reasoning chunks are not yet supported
     * by the streaming API even when extended thinking is enabled.
     */
    stream(task: string): AsyncGenerator<{
        type: 'text';
        content: string;
    }>;
    /**
     * Execute with structured output - combine tool use with schema-constrained response
     */
    executeWithOutput<T extends z.ZodTypeAny>(task: string, outputSchema: T): Promise<{
        success: boolean;
        output?: z.infer<T>;
        error?: string;
        steps: AgentStep[];
        usage?: AgentResult['usage'];
    }>;
    /**
     * Analyze a task before executing to determine optimal approach
     */
    analyzeTask(task: string): Promise<TaskAnalysis>;
    /**
     * Fix a specific file based on feedback
     */
    fixFile(filePath: string, feedback: string, suggestion?: string): Promise<{
        success: boolean;
        result: string;
        diff?: string;
    }>;
    /**
     * Run tests and fix failures
     */
    fixTests(testCommand?: string): Promise<{
        success: boolean;
        result: string;
        iterations: number;
    }>;
    /**
     * Commit changes with a message
     */
    commitChanges(message: string): Promise<{
        success: boolean;
        commitSha?: string;
    }>;
    /**
     * Build the complete tool set
     */
    private buildToolSet;
    /**
     * Get the system prompt for the agent
     */
    private getSystemPrompt;
    private log;
}
/**
 * Run a one-shot task with the agent
 */
export declare function runTask(task: string, config?: AgentConfig): Promise<AgentResult>;
/**
 * Run a task with pre-analysis to determine optimal configuration
 */
export declare function runSmartTask(task: string, config?: Omit<AgentConfig, 'reasoning' | 'webSearch'>): Promise<AgentResult>;
//# sourceMappingURL=agent.d.ts.map