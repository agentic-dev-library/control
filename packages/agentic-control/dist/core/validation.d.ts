/**
 * Configuration validation using Zod schemas
 */
import { z } from 'zod';
export declare const AgenticConfigSchema: z.ZodObject<{
    tokens: z.ZodOptional<z.ZodObject<{
        organizations: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            name: z.ZodString;
            tokenEnvVar: z.ZodString;
        }, z.core.$strip>>>;
        defaultTokenEnvVar: z.ZodOptional<z.ZodString>;
        prReviewTokenEnvVar: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    defaultRepository: z.ZodOptional<z.ZodString>;
    coordinationPr: z.ZodOptional<z.ZodNumber>;
    logLevel: z.ZodOptional<z.ZodEnum<{
        info: "info";
        error: "error";
        debug: "debug";
        warn: "warn";
    }>>;
    verbose: z.ZodOptional<z.ZodBoolean>;
    cursor: z.ZodOptional<z.ZodObject<{
        apiKeyEnvVar: z.ZodOptional<z.ZodString>;
        baseUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    fleet: z.ZodOptional<z.ZodObject<{
        autoCreatePr: z.ZodOptional<z.ZodBoolean>;
        openAsCursorGithubApp: z.ZodOptional<z.ZodBoolean>;
        skipReviewerRequest: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
    triage: z.ZodOptional<z.ZodObject<{
        provider: z.ZodOptional<z.ZodEnum<{
            anthropic: "anthropic";
            openai: "openai";
            google: "google";
            mistral: "mistral";
            azure: "azure";
        }>>;
        model: z.ZodOptional<z.ZodString>;
        apiKeyEnvVar: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    mcp: z.ZodOptional<z.ZodObject<{
        cursor: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            tokenEnvVar: z.ZodOptional<z.ZodString>;
            tokenEnvVarFallbacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
            mode: z.ZodOptional<z.ZodEnum<{
                stdio: "stdio";
                proxy: "proxy";
            }>>;
            command: z.ZodOptional<z.ZodString>;
            args: z.ZodOptional<z.ZodArray<z.ZodString>>;
            proxyUrl: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        github: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            tokenEnvVar: z.ZodOptional<z.ZodString>;
            tokenEnvVarFallbacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
            mode: z.ZodOptional<z.ZodEnum<{
                stdio: "stdio";
                proxy: "proxy";
            }>>;
            command: z.ZodOptional<z.ZodString>;
            args: z.ZodOptional<z.ZodArray<z.ZodString>>;
            proxyUrl: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        context7: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            tokenEnvVar: z.ZodOptional<z.ZodString>;
            tokenEnvVarFallbacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
            mode: z.ZodOptional<z.ZodEnum<{
                stdio: "stdio";
                proxy: "proxy";
            }>>;
            command: z.ZodOptional<z.ZodString>;
            args: z.ZodOptional<z.ZodArray<z.ZodString>>;
            proxyUrl: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        '21st-magic': z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            tokenEnvVar: z.ZodOptional<z.ZodString>;
            tokenEnvVarFallbacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
            mode: z.ZodOptional<z.ZodEnum<{
                stdio: "stdio";
                proxy: "proxy";
            }>>;
            command: z.ZodOptional<z.ZodString>;
            args: z.ZodOptional<z.ZodArray<z.ZodString>>;
            proxyUrl: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$catchall<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        tokenEnvVar: z.ZodOptional<z.ZodString>;
        tokenEnvVarFallbacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
        mode: z.ZodOptional<z.ZodEnum<{
            stdio: "stdio";
            proxy: "proxy";
        }>>;
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString>>;
        proxyUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>>;
}, z.core.$strip>;
/**
 * Validate configuration object against schema
 */
export declare function validateConfig(config: unknown): void;
/**
 * Validate environment variable exists and is not empty
 */
export declare function validateEnvVar(envVar: string, description?: string): string;
/**
 * Validate environment variable with clear error message
 */
export declare function validateEnvVarWithMessage(envVar: string, purpose: string): string;
/**
 * Validate repository format (owner/repo)
 */
export declare function validateRepository(repo: string): void;
/**
 * Validate git reference format
 */
export declare function validateGitRef(ref: string): void;
/**
 * Validate positive integer
 */
export declare function validatePositiveInt(value: string, field: string): number;
//# sourceMappingURL=validation.d.ts.map