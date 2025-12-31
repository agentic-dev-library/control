# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-12-25

### Added
- LICENSE file (MIT) for legal compliance (#18)
- TypeDoc documentation with jbcom branding
- Pre-commit hooks for code quality (.pre-commit-config.yaml)
- Example usage file (examples/example.ts)
- Agent autonomy policy and operational guidelines
- Memory bank for ecosystem session documentation
- Complete API documentation generation via TypeDoc
- Semantic-release automation with conventional commits
- Full release automation via semantic-release (Node.js)

### Changed
- **BREAKING**: Migrated documentation from Sphinx (Python) to TypeDoc (TypeScript)
- **BREAKING**: Switched from python-semantic-release to semantic-release (Node.js)
- Updated GitHub Actions workflows for TypeDoc deployment
- Fixed Docker workflow attestation step
- Fixed CI workflow to use proper semantic-release
- Improved TypeDoc configuration with comprehensive settings
- Updated GitHub repository links to agentic-dev-library organization
- Automated versioning, changelog generation, and npm publishing

### Removed
- Old Sphinx documentation files (conf.py, index.rst, etc.)
- Python documentation dependencies
- Manual version management and release workflows
- python-semantic-release dependency

### Fixed
- Documentation deployment workflow now uses correct tooling (TypeDoc)
- Docker build attestation now properly references build output
- CI release action uses stable version tag
- All workflow failures on main branch resolved

## [0.3.0] - 2024-12-XX

### Added
- Refactor to @agentic-dev-library/triage primitives
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
