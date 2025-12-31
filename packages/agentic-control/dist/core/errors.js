/**
 * Typed error classes for agentic-control
 */
export var SandboxErrorCode;
(function (SandboxErrorCode) {
    SandboxErrorCode["CONTAINER_CREATE_FAILED"] = "CONTAINER_CREATE_FAILED";
    SandboxErrorCode["CONTAINER_START_FAILED"] = "CONTAINER_START_FAILED";
    SandboxErrorCode["EXECUTION_TIMEOUT"] = "EXECUTION_TIMEOUT";
    SandboxErrorCode["MEMORY_LIMIT_EXCEEDED"] = "MEMORY_LIMIT_EXCEEDED";
    SandboxErrorCode["WORKSPACE_MOUNT_FAILED"] = "WORKSPACE_MOUNT_FAILED";
    SandboxErrorCode["OUTPUT_EXTRACTION_FAILED"] = "OUTPUT_EXTRACTION_FAILED";
    SandboxErrorCode["RUNTIME_NOT_FOUND"] = "RUNTIME_NOT_FOUND";
})(SandboxErrorCode || (SandboxErrorCode = {}));
export class SandboxError extends Error {
    code;
    containerId;
    cause;
    constructor(message, code, containerId, cause) {
        super(message);
        this.code = code;
        this.containerId = containerId;
        this.cause = cause;
        this.name = 'SandboxError';
    }
}
export var DockerErrorCode;
(function (DockerErrorCode) {
    DockerErrorCode["BUILD_FAILED"] = "BUILD_FAILED";
    DockerErrorCode["PUSH_FAILED"] = "PUSH_FAILED";
    DockerErrorCode["PLATFORM_NOT_SUPPORTED"] = "PLATFORM_NOT_SUPPORTED";
    DockerErrorCode["REGISTRY_AUTH_FAILED"] = "REGISTRY_AUTH_FAILED";
})(DockerErrorCode || (DockerErrorCode = {}));
export class DockerBuildError extends Error {
    code;
    dockerfile;
    cause;
    constructor(message, code, dockerfile, cause) {
        super(message);
        this.code = code;
        this.dockerfile = dockerfile;
        this.cause = cause;
        this.name = 'DockerBuildError';
    }
}
export var ConfigErrorCode;
(function (ConfigErrorCode) {
    ConfigErrorCode["INVALID_SCHEMA"] = "INVALID_SCHEMA";
    ConfigErrorCode["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    ConfigErrorCode["INVALID_VALUE"] = "INVALID_VALUE";
    ConfigErrorCode["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
})(ConfigErrorCode || (ConfigErrorCode = {}));
export class ConfigurationError extends Error {
    code;
    field;
    cause;
    constructor(message, code, field, cause) {
        super(message);
        this.code = code;
        this.field = field;
        this.cause = cause;
        this.name = 'ConfigurationError';
    }
}
//# sourceMappingURL=errors.js.map