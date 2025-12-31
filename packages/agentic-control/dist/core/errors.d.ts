/**
 * Typed error classes for agentic-control
 */
export declare enum SandboxErrorCode {
    CONTAINER_CREATE_FAILED = "CONTAINER_CREATE_FAILED",
    CONTAINER_START_FAILED = "CONTAINER_START_FAILED",
    EXECUTION_TIMEOUT = "EXECUTION_TIMEOUT",
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
    WORKSPACE_MOUNT_FAILED = "WORKSPACE_MOUNT_FAILED",
    OUTPUT_EXTRACTION_FAILED = "OUTPUT_EXTRACTION_FAILED",
    RUNTIME_NOT_FOUND = "RUNTIME_NOT_FOUND"
}
export declare class SandboxError extends Error {
    code: SandboxErrorCode;
    containerId?: string | undefined;
    cause?: Error | undefined;
    constructor(message: string, code: SandboxErrorCode, containerId?: string | undefined, cause?: Error | undefined);
}
export declare enum DockerErrorCode {
    BUILD_FAILED = "BUILD_FAILED",
    PUSH_FAILED = "PUSH_FAILED",
    PLATFORM_NOT_SUPPORTED = "PLATFORM_NOT_SUPPORTED",
    REGISTRY_AUTH_FAILED = "REGISTRY_AUTH_FAILED"
}
export declare class DockerBuildError extends Error {
    code: DockerErrorCode;
    dockerfile?: string | undefined;
    cause?: Error | undefined;
    constructor(message: string, code: DockerErrorCode, dockerfile?: string | undefined, cause?: Error | undefined);
}
export declare enum ConfigErrorCode {
    INVALID_SCHEMA = "INVALID_SCHEMA",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    INVALID_VALUE = "INVALID_VALUE",
    FILE_NOT_FOUND = "FILE_NOT_FOUND"
}
export declare class ConfigurationError extends Error {
    code: ConfigErrorCode;
    field?: string | undefined;
    cause?: Error | undefined;
    constructor(message: string, code: ConfigErrorCode, field?: string | undefined, cause?: Error | undefined);
}
//# sourceMappingURL=errors.d.ts.map