# Product Overview

agentic-control is a unified AI agent fleet management and orchestration toolkit with dual-language architecture:

## TypeScript Core
- **Fleet Management**: Spawn, monitor, and coordinate Cursor Background Agents
- **AI Triage**: Analyze conversations, review code, extract tasks using pluggable AI providers (Anthropic, OpenAI, Google, etc.)
- **GitHub Integration**: Multi-org token management with intelligent token switching
- **Handoff Protocol**: Seamless agent continuity across sessions
- **MCP Server**: Model Context Protocol integration

## Python CrewAI
- **Autonomous Crews**: Specialized AI agent teams for game development tasks
- **Flows**: Orchestrated workflows combining multiple crews
- **Package-Agnostic Engine**: Discovers and runs crews from `.crewai/` directories
- **MCP Integration**: Can connect to MCP servers

## Key Features
- Security-first design (no hardcoded credentials)
- Multi-organization GitHub support with automatic token selection
- Pluggable AI providers via Vercel AI SDK
- CLI and programmatic APIs
- Both TypeScript and Python components can work independently or together
