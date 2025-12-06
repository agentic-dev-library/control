# Requirements Document

## Introduction

This feature establishes comprehensive API documentation and a symbiotic integration architecture between the TypeScript (agentic-control) and Python (crew-agents) components of the system. The integration enables the TypeScript fleet management and triage systems to invoke CrewAI crews as tools while maintaining each component's standalone capabilities and API clarity. This creates a symbiotic relationship where TypeScript agents can delegate specialized development tasks to CrewAI crews, and both systems remain independently usable with well-documented APIs.

## Glossary

- **agentic-control**: The TypeScript-based fleet management, triage, and orchestration system
- **crew-agents**: The Python-based CrewAI package providing autonomous agent crews for development tasks
- **Fleet**: The TypeScript system that manages and coordinates Cursor Background Agents
- **Crew**: A specialized team of AI agents in the Python CrewAI framework, discovered from `.crewai/` directories
- **Tool**: A callable function or service that can be invoked by an agent
- **MCP**: Model Context Protocol, a standard for agent-to-service communication
- **Standalone API**: An API that can be used independently without requiring other system components
- **Symbiotic Integration**: A relationship where components enhance each other while remaining independently functional
- **Cursor Background Agent**: An AI agent spawned by the Fleet system to work on GitHub repositories
- **Triage**: The AI-powered analysis system for conversations, code review, and task extraction
- **Package-Agnostic Engine**: The crew-agents discovery system that finds crews in any package's `.crewai/` directory

## Requirements

### Requirement 1

**User Story:** As a TypeScript developer, I want to use the agentic-control fleet management and triage APIs independently, so that I can orchestrate agents and perform AI analysis without requiring Python dependencies.

#### Acceptance Criteria

1. WHEN a developer imports the agentic-control TypeScript package THEN the system SHALL provide complete fleet management and triage functionality without Python runtime dependencies
2. WHEN a developer calls fleet management APIs THEN the system SHALL execute all core operations (spawn, monitor, coordinate, followup) using only TypeScript components
3. WHEN a developer calls triage APIs THEN the system SHALL execute all analysis operations (conversation analysis, code review, task extraction) using only TypeScript components
4. THE agentic-control package SHALL expose a clear public API through index.ts exports for fleet, triage, github, handoff, and core modules
5. WHEN documentation is accessed THEN the system SHALL provide comprehensive TypeScript API documentation with working standalone examples for all exported modules

### Requirement 2

**User Story:** As a Python developer, I want to use the crew-agents package independently, so that I can run autonomous agent crews without requiring Node.js dependencies.

#### Acceptance Criteria

1. WHEN a developer installs the crew-agents Python package THEN the system SHALL provide complete crew discovery and execution functionality without Node.js runtime dependencies
2. WHEN a developer executes crews via CLI THEN the system SHALL run all crew operations (list, run, info) using only Python components
3. WHEN a developer imports crew-agents in Python THEN the system SHALL provide access to flows (GameDesignFlow, ImplementationFlow, AssetGenerationFlow) and crews without Node.js
4. THE crew-agents package SHALL expose a clear public API through __init__.py exports for flows and crews modules
5. WHEN documentation is accessed THEN the system SHALL provide comprehensive Python API documentation with working standalone examples for CLI and programmatic usage

### Requirement 3

**User Story:** As a TypeScript fleet operator, I want to invoke CrewAI crews as tools from my triage and fleet systems, so that I can delegate specialized development tasks to autonomous Python crews.

#### Acceptance Criteria

1. WHEN a TypeScript triage agent needs to execute a specialized development task THEN the system SHALL provide a tool interface to invoke crew-agents crews
2. WHEN a crew tool is invoked with package name, crew name, and input THEN the system SHALL spawn a Python subprocess, execute the crew, and return structured results to TypeScript
3. WHEN a crew execution fails THEN the system SHALL capture stderr and exit codes and propagate error information back to the TypeScript caller with actionable details
4. THE crew tool interface SHALL accept package name, crew name, and input specification as typed TypeScript parameters
5. WHEN a crew completes execution THEN the system SHALL parse the crew output and return results as a typed TypeScript object

### Requirement 4

**User Story:** As a system architect, I want clear documentation of the integration architecture, so that developers understand how TypeScript and Python components interact.

#### Acceptance Criteria

1. WHEN developers read the architecture documentation THEN the system SHALL explain the standalone capabilities of each component
2. WHEN developers read the integration documentation THEN the system SHALL explain how TypeScript invokes Python crews as tools
3. THE documentation SHALL include sequence diagrams showing the request-response flow between TypeScript and Python
4. THE documentation SHALL include code examples demonstrating both standalone usage and integrated usage
5. WHEN developers review the codebase THEN the system SHALL provide inline documentation explaining integration points

### Requirement 5

**User Story:** As a fleet operator, I want to configure crew tool availability and execution parameters, so that I can control which crews are accessible to TypeScript agents and how they execute.

#### Acceptance Criteria

1. WHEN the system initializes THEN the system SHALL load crew tool configuration from the agentic.config.json file under a crews section
2. WHEN a TypeScript agent requests available crews THEN the system SHALL query the Python crew-agents CLI to list discovered crews
3. THE configuration SHALL allow specifying the Python executable path, crew-agents package location, and default timeout values
4. THE configuration SHALL allow specifying environment variables to pass to crew executions
5. WHEN configuration is invalid THEN the system SHALL provide clear validation errors with remediation guidance

### Requirement 6

**User Story:** As a developer, I want type-safe interfaces between TypeScript and Python, so that I can catch integration errors at compile time.

#### Acceptance Criteria

1. WHEN crew tool interfaces are defined THEN the system SHALL provide TypeScript type definitions for all crew inputs and outputs
2. WHEN Python crews define their schemas THEN the system SHALL generate corresponding TypeScript types
3. THE system SHALL validate crew inputs against schemas before invoking Python processes
4. WHEN type mismatches occur THEN the system SHALL report detailed type errors at the TypeScript boundary
5. THE system SHALL use Zod schemas for runtime validation of crew tool parameters

### Requirement 7

**User Story:** As a performance-conscious developer, I want efficient crew invocation with proper timeout handling, so that tool calls do not block indefinitely or introduce excessive latency.

#### Acceptance Criteria

1. WHEN a crew tool is invoked THEN the system SHALL spawn a Python subprocess using the configured Python executable
2. WHEN crew execution is in progress THEN the system SHALL stream stdout and stderr to enable progress monitoring
3. WHEN a crew tool times out THEN the system SHALL terminate the Python subprocess and return a timeout error with partial output
4. THE system SHALL allow configuring default timeout values in the configuration
5. THE system SHALL allow overriding timeout values per crew invocation

### Requirement 8

**User Story:** As a testing engineer, I want to test TypeScript and Python components independently, so that I can validate each system without integration complexity.

#### Acceptance Criteria

1. WHEN TypeScript tests run THEN the system SHALL provide mock implementations of crew tools that do not require Python
2. WHEN Python tests run THEN the system SHALL execute crew logic without requiring TypeScript runtime
3. THE test suites SHALL include integration tests that validate the TypeScript-Python boundary
4. WHEN integration tests fail THEN the system SHALL clearly indicate whether the failure is in TypeScript, Python, or the integration layer
5. THE system SHALL provide test utilities for simulating crew tool invocations in TypeScript tests

### Requirement 9

**User Story:** As a developer, I want clear error handling across the language boundary, so that I can diagnose and fix issues efficiently.

#### Acceptance Criteria

1. WHEN a Python crew raises an exception THEN the system SHALL serialize the error with stack trace and context
2. WHEN the TypeScript side receives an error THEN the system SHALL deserialize it into a typed Error object
3. THE system SHALL preserve error types and messages across the language boundary
4. WHEN process communication fails THEN the system SHALL distinguish between communication errors and crew execution errors
5. THE error objects SHALL include sufficient context to identify the failing crew and input parameters

### Requirement 10

**User Story:** As a documentation maintainer, I want comprehensive API documentation for both TypeScript and Python components, so that developers can effectively use both standalone and integrated features.

#### Acceptance Criteria

1. THE TypeScript documentation SHALL include API reference for all exported modules (fleet, triage, github, handoff, core)
2. THE Python documentation SHALL include API reference for all exported modules (flows, crews, core, tools)
3. THE documentation SHALL include standalone usage examples for TypeScript fleet management and triage operations
4. THE documentation SHALL include standalone usage examples for Python crew discovery and execution
5. THE documentation SHALL include integration examples showing how TypeScript code invokes Python crews as tools

### Requirement 11

**User Story:** As a system architect, I want the integration to reflect the symbiotic relationship between agentic-control and crew-agents, so that each system enhances the other while maintaining independence.

#### Acceptance Criteria

1. THE TypeScript agentic-control system SHALL provide orchestration, fleet management, and multi-provider AI triage as its core strengths
2. THE Python crew-agents system SHALL provide specialized autonomous crews for development tasks as its core strength
3. WHEN TypeScript agents encounter tasks requiring specialized development workflows THEN the system SHALL delegate to Python crews via the tool interface
4. WHEN Python crews need to spawn additional agents or perform GitHub operations THEN the system SHALL document how to invoke TypeScript functionality
5. THE architecture documentation SHALL explicitly describe the symbiotic relationship and when to use each component
