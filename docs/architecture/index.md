# Architecture

## Overview

agentic-control is a unified AI agent fleet management system with two main components:

1. **TypeScript Core** - Fleet management, triage, and orchestration
2. **Python CrewAI** - Autonomous AI crews for development tasks

## TypeScript Core

```{mermaid}
graph TD
    A[CLI] --> B[Fleet Manager]
    A --> C[Triage Agent]
    B --> D[Cursor API]
    C --> E[Analyzer]
    C --> F[Resolver]
    C --> G[GitHub Client]
    B --> H[MCP Server]
```

### Modules

- **Fleet** - Agent fleet management and orchestration
- **Triage** - Issue analysis and routing
- **GitHub** - GitHub API integration
- **Handoff** - Agent handoff management
- **Core** - Shared utilities and configuration

## Python CrewAI

```{mermaid}
graph TD
    A[Main] --> B[Flow Runner]
    B --> C[Crews]
    C --> D[Game Builder]
    C --> E[Creature Design]
    C --> F[World Design]
    C --> G[Asset Pipeline]
    C --> H[QA Validation]
    D --> I[Tools]
    E --> I
    F --> I
    G --> I
    H --> I
```

### Components

- **Crews** - Specialized AI agent teams for specific tasks
- **Flows** - Orchestrated workflows combining multiple crews
- **Tools** - Utility tools for file operations and more
- **Config** - LLM and agent configuration

## MCP Integration

Both components can communicate via MCP (Model Context Protocol):

- TypeScript provides MCP server capabilities
- Python CrewAI agents can connect to MCP servers

## Configuration

Configuration is managed through:

- `agentic.config.js/ts` for TypeScript
- `crewbase.yaml` for Python crews
- Environment variables for secrets
