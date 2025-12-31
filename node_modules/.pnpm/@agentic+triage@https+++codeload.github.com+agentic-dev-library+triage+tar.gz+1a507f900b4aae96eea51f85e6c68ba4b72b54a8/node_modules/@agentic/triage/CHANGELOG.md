# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Refactor to @agentic/triage primitives
- Settings app configuration
- Ecosystem-specific settings with ESLint
- Standard Dependabot configuration with grouped updates
- Migration to agentic-control integration

### Changed
- Node.js updated to version 25 in Docker
- Dependency updates for AI SDK, MCP, and Ollama

## [0.2.1] - 2025-12-14

### Fixed
- Ollama Cloud URL configuration
- GraphQL MCP integration
- Dynamic prompts improvements
- Switch to GHCR only, removing Docker Hub dependency

## [0.2.0] - 2025-12-14

### Added
- GitHub Action for automated triage
- Docker support for easy deployment
- Reusable workflows for CI/CD
- Self-dogfooding triage workflow

## [0.1.0] - 2025-12-14

### Added
- Initial release
- GitHub issue triage functionality
- AI-powered label suggestions
- Project board integration

### Fixed
- Downgrade zod to v3 for AI SDK compatibility
