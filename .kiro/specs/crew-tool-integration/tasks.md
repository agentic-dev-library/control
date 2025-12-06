# Implementation Plan

- [x] 1. Set up TypeScript crew tool infrastructure
  - [x] Create `src/crews/` directory for crew tool implementation
  - [x] Add Zod dependency for runtime validation
  - [x] Add fast-check dependency for property-based testing
  - [x] Update TypeScript exports in `src/index.ts` to include crew tool
  - [x] Add crews module to package.json exports
  - _Requirements: 1.4, 6.5_
  - _Status: Complete - All infrastructure is in place_

- [x] 2. Implement core CrewTool class
- [x] 2.1 Create CrewTool configuration types and validation
  - Define `CrewToolConfig`, `InvokeCrewOptions`, `CrewResult`, `CrewInfo` interfaces in `src/crews/types.ts`
  - Implement Zod schemas for runtime validation
  - Add configuration loading from `agentic.config.json` crews section
  - _Requirements: 5.1, 5.3, 6.5_

- [x] 2.2 Write property test for configuration validation
  - **Property 7: Configuration validation errors**
  - **Validates: Requirements 5.5**

- [x] 2.3 Implement subprocess execution logic
  - Create `CrewTool` class in `src/crews/crew-tool.ts`
  - Implement `invokeCrew()` method with subprocess spawning
  - Add stdout/stderr streaming support
  - Implement timeout handling with process termination
  - _Requirements: 3.2, 7.1, 7.2, 7.3_

- [x] 2.4 Write property test for subprocess execution
  - **Property 4: Crew invocation subprocess execution**
  - **Validates: Requirements 3.2, 3.5, 7.1**

- [x] 2.5 Write property test for timeout handling
  - **Property 11: Timeout handling**
  - **Validates: Requirements 7.3**

- [x] 2.6 Write property test for timeout override
  - **Property 12: Timeout override**
  - **Validates: Requirements 7.5**

- [x] 2.7 Implement error handling and categorization
  - Create `CrewToolError` class with error categories
  - Implement error serialization from Python stderr
  - Add error context (crew name, input parameters)
  - Distinguish between subprocess and crew execution errors
  - _Requirements: 3.3, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 2.8 Write property test for error handling
  - **Property 13: Error serialization and preservation**
  - **Validates: Requirements 3.3, 9.1, 9.2, 9.3, 9.5**

- [x] 2.9 Write property test for error type distinction
  - **Property 14: Error type distinction**
  - **Validates: Requirements 9.4**

- [x] 3. Implement crew discovery functionality
- [x] 3.1 Implement listCrews() method
  - Execute `crew-agents list` via subprocess
  - Parse CLI output to extract crew information
  - Return array of `CrewInfo` objects
  - _Requirements: 5.2_

- [x] 3.2 Write property test for crew discovery
  - **Property 5: Crew discovery via CLI**
  - **Validates: Requirements 5.2**

- [x] 3.3 Implement getCrewInfo() method
  - Execute `crew-agents info <package> <crew>` via subprocess
  - Parse CLI output to extract detailed crew information
  - Return `CrewInfo` object with description
  - _Requirements: 5.2_

- [x] 4. Implement configuration and environment variable handling
- [x] 4.1 Add environment variable passing to subprocess
  - Merge configured env vars with process.env
  - Pass to subprocess via spawn options
  - _Requirements: 5.4_

- [x] 4.3 Write property test for environment variable passing
  - **Property 6: Configuration environment variable passing**
  - **Validates: Requirements 5.4**

- [x] 4.2 Implement Python executable and path detection
  - Add auto-detection for Python executable (uv, python3, python)
  - Add auto-detection for crew-agents package location
  - Fall back to configured values if detection fails
  - _Requirements: 5.3_

- [x] 5. Implement input validation
- [x] 5.1 Create Zod schemas for crew invocation parameters
  - Define schemas for package name, crew name, input
  - Add validation for required fields
  - Add format validation (alphanumeric, hyphens, underscores)
  - _Requirements: 6.3_

- [x] 5.2 Write property test for input validation
  - **Property 8: Input validation before execution**
  - **Validates: Requirements 6.3**

- [x] 5.3 Write property test for type mismatch errors
  - **Property 9: Type mismatch error reporting**
  - **Validates: Requirements 6.4**

- [x] 6. Integrate CrewTool with Fleet system
- [x] 6.1 Extend Fleet class with crew tool support
  - Add optional `crewTool` property to Fleet class
  - Initialize CrewTool if crews config is present
  - Implement `spawnWithCrewSpec()` method
  - _Requirements: 3.1, 11.3_

- [x] 6.2 Write unit tests for Fleet crew integration
  - Test Fleet initialization with crew config
  - Test spawnWithCrewSpec() method
  - Test error handling when crew tool not configured
  - _Requirements: 3.1_

- [x] 7. Integrate CrewTool with Triage system
- [x] 7.1 Extend AIAnalyzer class with crew tool support
  - Add optional `crewTool` property to AIAnalyzer class
  - Initialize CrewTool if crews config is present
  - Implement `delegateToCrew()` method
  - _Requirements: 3.1, 11.3_

- [x] 7.2 Write unit tests for Triage crew integration
  - Test AIAnalyzer initialization with crew config
  - Test delegateToCrew() method
  - Test error handling when crew tool not configured
  - _Requirements: 3.1_

- [ ] 8. Extend configuration system
- [x] 8.1 Add CrewsConfig to AgenticConfig type
  - Update `src/core/config.ts` with CrewsConfig interface
  - Add crews section to configuration loading
  - Update configuration merging logic
  - _Requirements: 5.1, 5.3_

- [x] 8.2 Write unit tests for configuration loading
  - Test loading crews config from file
  - Test configuration merging with defaults
  - Test configuration validation
  - _Requirements: 5.1_

- [ ] 9. Create test utilities and mocks
- [x] 9.1 Implement MockCrewTool for testing
  - Create `tests/crews/crew-tool.mock.ts`
  - Implement mock invokeCrew() method
  - Add methods to set mock results
  - _Requirements: 8.1, 8.5_

- [x] 9.2 Create test fixtures for integration tests
  - Create test crew package in `tests/fixtures/test-crew/`
  - Add manifest.yaml and crew configuration
  - Add simple test crew that returns predictable output
  - _Requirements: 8.3_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Write TypeScript API documentation
- [x] 11.1 Add TSDoc comments to CrewTool class
  - Document all public methods with examples
  - Include standalone usage examples
  - Include integration usage examples
  - _Requirements: 10.1, 10.3, 10.5_

- [x] 11.2 Add TSDoc comments to Fleet crew methods
  - Document spawnWithCrewSpec() method
  - Include usage examples
  - _Requirements: 10.1, 10.3, 10.5_

- [x] 11.3 Add TSDoc comments to Triage crew methods
  - Document delegateToCrew() method
  - Include usage examples
  - _Requirements: 10.1, 10.3, 10.5_

- [x] 11.4 Update main README with crew integration section
  - Add section on crew tool usage
  - Add configuration examples
  - Add integration examples
  - _Requirements: 10.5_

- [ ] 12. Write Python API documentation
- [x] 12.1 Add docstrings to runner.py functions
  - Document run_crew() function with examples
  - Include standalone usage examples
  - Include TypeScript integration examples
  - _Requirements: 10.2, 10.4, 10.5_

- [x] 12.2 Update Python README with integration section
  - Add section on TypeScript integration
  - Add examples of being invoked from TypeScript
  - _Requirements: 10.2, 10.4, 10.5_

- [ ] 13. Create architecture documentation
- [x] 13.1 Write architecture.md document
  - Create `docs/architecture.md`
  - Add system overview with component diagram
  - Document standalone capabilities of each system
  - Document integration architecture
  - Describe symbiotic relationship and when to use each component
  - Add sequence diagrams for integration flows
  - _Requirements: 4.3, 4.4, 11.5_

- [x] 13.2 Create integration examples
  - Create `docs/examples/integration/` directory
  - Add example: Fleet with crew-generated spec
  - Add example: Triage with crew delegation
  - Add example: Error handling
  - Add example: Configuration
  - _Requirements: 4.4, 10.5_

- [ ] 14. Write integration tests
- [x] 14.1 Create end-to-end integration tests
  - Create `tests/integration/crew-tool-integration.test.ts`
  - Test successful crew invocation with real subprocess
  - Test error propagation from Python to TypeScript
  - Test timeout handling with real subprocess
  - Test environment variable passing
  - _Requirements: 8.3_

- [x] 14.2 Write property test for integration error attribution
  - **Property 15: Integration test error attribution**
  - **Validates: Requirements 8.4**

- [ ] 15. Add CLI commands for crew tool
- [x] 15.1 Add crew commands to CLI
  - Add `agentic crews list` command
  - Add `agentic crews info <package> <crew>` command
  - Add `agentic crews run <package> <crew> --input <input>` command
  - _Requirements: 3.1_

- [x] 15.2 Write unit tests for CLI commands
  - Test crews list command
  - Test crews info command
  - Test crews run command
  - _Requirements: 3.1_

- [ ] 16. Verify standalone capabilities
- [x] 16.1 Test TypeScript standalone without Python
  - Create test environment without Python
  - Verify Fleet operations work
  - Verify Triage operations work
  - Verify GitHub operations work
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 16.2 Write property test for standalone TypeScript fleet
  - **Property 1: Standalone TypeScript fleet operations**
  - **Validates: Requirements 1.2**

- [x] 16.3 Write property test for standalone TypeScript triage
  - **Property 2: Standalone TypeScript triage operations**
  - **Validates: Requirements 1.3**

- [x] 16.4 Test Python standalone without Node.js
  - Create test environment without Node.js
  - Verify crew-agents CLI works
  - Verify crew discovery works
  - Verify crew execution works
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 16.5 Write property test for standalone Python crews
  - **Property 3: Standalone Python crew operations**
  - **Validates: Requirements 2.2**

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
