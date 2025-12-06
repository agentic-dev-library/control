# agentic-control

> Unified AI agent fleet management, triage, and orchestration toolkit for control centers

[![npm version](https://badge.fury.io/js/agentic-control.svg)](https://www.npmjs.com/package/agentic-control)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **🎯 Intelligent Token Switching** - Automatically selects the correct GitHub token based on organization
- **🚀 Fleet Management** - Spawn, monitor, and coordinate Cursor Background Agents
- **🔍 AI-Powered Triage** - Analyze conversations, review code, extract tasks
- **🤝 Station-to-Station Handoff** - Seamless agent continuity across sessions
- **🔐 Multi-Org Support** - Manage agents across multiple GitHub organizations
- **🔌 Pluggable AI Providers** - Choose your preferred AI provider (Anthropic, OpenAI, Google, etc.)
- **🔒 Security First** - No hardcoded values, all configuration is user-provided

## Installation

```bash
npm install -g agentic-control
# or
pnpm add -g agentic-control
```

### Installing AI Providers

AI triage features require installing a provider SDK. Install the one you need:

```bash
# Anthropic (recommended)
pnpm add @ai-sdk/anthropic

# OpenAI
pnpm add @ai-sdk/openai

# Google AI
pnpm add @ai-sdk/google

# Mistral
pnpm add @ai-sdk/mistral

# Azure OpenAI
pnpm add @ai-sdk/azure
```

## Quick Start

### 1. Initialize Configuration

```bash
agentic init
```

The `init` command is intelligent:
- Detects your Git repository from `git remote`
- Scans for existing tokens in your environment (`GITHUB_*_TOKEN`, etc.)
- Interactively prompts for missing configuration (if terminal is interactive)
- Generates a working `agentic.config.json`

Example generated config:

```json
{
  "tokens": {
    "organizations": {
      "my-org": {
        "name": "my-org",
        "tokenEnvVar": "GITHUB_MY_ORG_TOKEN"
      }
    },
    "defaultTokenEnvVar": "GITHUB_TOKEN",
    "prReviewTokenEnvVar": "GITHUB_TOKEN"
  },
  "defaultRepository": "my-org/my-repo",
  "fleet": {
    "autoCreatePr": false,
    "openAsCursorGithubApp": false
  },
  "triage": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "apiKeyEnvVar": "ANTHROPIC_API_KEY"
  }
}
```

### 2. Set Environment Variables

```bash
export GITHUB_TOKEN="ghp_xxx"           # Default token
export GITHUB_MY_ORG_TOKEN="ghp_xxx"    # Organization-specific token
export ANTHROPIC_API_KEY="sk-xxx"       # For AI triage (or your provider's key)
export CURSOR_API_KEY="xxx"             # For fleet management
```

### 3. Check Token Status

```bash
agentic tokens status
```

### 4. List Your Fleet

```bash
agentic fleet list --running
```

### 5. Spawn an Agent

```bash
agentic fleet spawn https://github.com/my-org/my-repo "Fix the CI workflow" --auto-pr
```

### 6. Analyze a Session

```bash
agentic triage analyze bc-xxx-xxx -o report.md --create-issues
```

## Commands

### Configuration

```bash
# Initialize configuration (interactive)
agentic init

# Non-interactive initialization
agentic init --non-interactive
```

### Token Management

```bash
# Check all token status
agentic tokens status

# Validate required tokens
agentic tokens validate

# Show token for a specific repo
agentic tokens for-repo my-org/my-repo
```

### Fleet Management

```bash
# List all agents
agentic fleet list

# List only running agents
agentic fleet list --running

# List available Cursor models
agentic fleet models

# Get fleet summary
agentic fleet summary

# Spawn a new agent
agentic fleet spawn <repo> <task>

# Spawn with options
agentic fleet spawn <repo> <task> --ref feature-branch --auto-pr --branch my-branch

# Send followup message
agentic fleet followup <agent-id> "Status update?"

# Run coordination loop
agentic fleet coordinate --pr 123 --repo my-org/my-repo
```

> **Note**: Model selection for fleet agents is handled by Cursor internally.
> You cannot specify a model when spawning agents. Use `agentic fleet models` to see available models.

### AI Triage

```bash
# Quick triage of text
agentic triage quick "Error in deployment pipeline"

# Review code changes
agentic triage review --base main --head HEAD

# Analyze agent conversation
agentic triage analyze <agent-id> -o report.md

# Create issues from analysis
agentic triage analyze <agent-id> --create-issues

# Use specific model (overrides config)
agentic triage analyze <agent-id> --model claude-opus-4-20250514
```

### Handoff Protocol

```bash
# Initiate handoff to successor
agentic handoff initiate <predecessor-id> --pr 123 --branch my-branch --repo https://github.com/my-org/my-repo

# Confirm health as successor
agentic handoff confirm <predecessor-id>

# Take over from predecessor
agentic handoff takeover <predecessor-id> 123 my-new-branch
```

## Configuration

### Configuration File

Create `agentic.config.json` in your project root (or run `agentic init`):

```json
{
  "tokens": {
    "organizations": {
      "my-company": {
        "name": "my-company",
        "tokenEnvVar": "GITHUB_COMPANY_TOKEN"
      },
      "open-source-org": {
        "name": "open-source-org",
        "tokenEnvVar": "GITHUB_OSS_TOKEN"
      }
    },
    "defaultTokenEnvVar": "GITHUB_TOKEN",
    "prReviewTokenEnvVar": "GITHUB_TOKEN"
  },
  "defaultRepository": "my-company/my-repo",
  "logLevel": "info",
  "fleet": {
    "autoCreatePr": true,
    "openAsCursorGithubApp": false
  },
  "triage": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "apiKeyEnvVar": "ANTHROPIC_API_KEY"
  }
}
```

Config is loaded using [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig).
Searches for: `agentic.config.json`, `.agenticrc`, `package.json` "agentic" key.

### AI Provider Configuration

Configure your preferred AI provider in the `triage` section:

| Provider | Package | `provider` value | Default API Key Env |
|----------|---------|------------------|---------------------|
| **Anthropic** | `@ai-sdk/anthropic` | `anthropic` | `ANTHROPIC_API_KEY` |
| **OpenAI** | `@ai-sdk/openai` | `openai` | `OPENAI_API_KEY` |
| **Google AI** | `@ai-sdk/google` | `google` | `GOOGLE_API_KEY` |
| **Mistral** | `@ai-sdk/mistral` | `mistral` | `MISTRAL_API_KEY` |
| **Azure** | `@ai-sdk/azure` | `azure` | `AZURE_API_KEY` |

Example with OpenAI:

```json
{
  "triage": {
    "provider": "openai",
    "model": "gpt-4o",
    "apiKeyEnvVar": "OPENAI_API_KEY"
  }
}
```

### Fleet Configuration

The `fleet` section configures default options for spawning agents:

```json
{
  "fleet": {
    "autoCreatePr": false,
    "openAsCursorGithubApp": false,
    "skipReviewerRequest": false
  }
}
```

| Option | Description | Default |
|--------|-------------|---------|
| `autoCreatePr` | Auto-create PR when agent completes | `false` |
| `openAsCursorGithubApp` | Open PR as Cursor GitHub App | `false` |
| `skipReviewerRequest` | Don't add user as reviewer | `false` |

CLI flags override config file defaults:

```bash
# Override autoCreatePr
agentic fleet spawn <repo> <task> --auto-pr

# Override openAsCursorGithubApp
agentic fleet spawn <repo> <task> --as-app

# Set custom branch name
agentic fleet spawn <repo> <task> --branch feature/my-fix
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | Default GitHub token | Recommended |
| `GITHUB_<ORG>_TOKEN` | Organization-specific tokens | Per org |
| `ANTHROPIC_API_KEY` | Anthropic API key | For Anthropic triage |
| `OPENAI_API_KEY` | OpenAI API key | For OpenAI triage |
| `CURSOR_API_KEY` | Cursor API key | For fleet ops |
| `AGENTIC_MODEL` | Default AI model | Optional |
| `AGENTIC_PROVIDER` | Default AI provider | Optional |
| `AGENTIC_REPOSITORY` | Default repository | Optional |
| `AGENTIC_LOG_LEVEL` | Log level (debug/info/warn/error) | Optional |

### Dynamic Organization Configuration

Add organizations via environment variables:

```bash
# Pattern: AGENTIC_ORG_<NAME>_TOKEN=<ENV_VAR_NAME>
export AGENTIC_ORG_MYCOMPANY_TOKEN=GITHUB_MYCOMPANY_TOKEN
export AGENTIC_ORG_PARTNER_TOKEN=PARTNER_GH_PAT
```

### PR Review Token

Configure a consistent identity for all PR review operations:

```bash
export AGENTIC_PR_REVIEW_TOKEN=GITHUB_TOKEN
```

## Programmatic Usage

```typescript
import { 
  Fleet, 
  AIAnalyzer, 
  GitHubClient,
  getTokenForRepo,
  setTokenConfig,
  addOrganization,
} from "agentic-control";

// Configure organizations programmatically
addOrganization({
  name: "my-company",
  tokenEnvVar: "GITHUB_COMPANY_TOKEN",
});

// Or configure everything at once
setTokenConfig({
  organizations: {
    "my-company": { name: "my-company", tokenEnvVar: "GITHUB_COMPANY_TOKEN" },
  },
  prReviewTokenEnvVar: "GITHUB_TOKEN",
});

// Fleet management
const fleet = new Fleet();
const agents = await fleet.list();
await fleet.spawn({
  repository: "https://github.com/my-company/my-repo",
  task: "Fix the bug",
  target: { autoCreatePr: true },
});

// Token-aware operations
const token = getTokenForRepo("my-company/my-repo");
// Returns value of GITHUB_COMPANY_TOKEN

// AI Analysis with default provider (from config)
const analyzer = new AIAnalyzer({ repo: "my-company/my-repo" });
const result = await analyzer.quickTriage("Error in deployment");

// AI Analysis with specific provider
const openaiAnalyzer = new AIAnalyzer({ 
  repo: "my-company/my-repo",
  provider: "openai",
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY,
});
```

## Token Switching Logic

The package automatically selects tokens based on organization configuration:

```
Repository                    → Token Used
────────────────────────────────────────────
my-company/repo-1             → GITHUB_COMPANY_TOKEN (configured)
my-company/repo-2             → GITHUB_COMPANY_TOKEN (configured)
unknown-org/repo              → GITHUB_TOKEN (default)

PR Review Operations          → Configured PR review token
```

### How It Works

1. **Config file** (`agentic.config.json`) defines org → token mappings
2. **Environment variables** (`AGENTIC_ORG_*_TOKEN`) add dynamic mappings
3. **Programmatic configuration** overrides at runtime
4. **Default token** (`GITHUB_TOKEN`) used for unconfigured orgs

## Architecture

```
agentic-control/
├── src/
│   ├── core/           # Types, tokens, config
│   │   ├── types.ts    # Shared type definitions
│   │   ├── tokens.ts   # Intelligent token switching
│   │   └── config.ts   # Configuration management (cosmiconfig)
│   ├── fleet/          # Cursor agent fleet management
│   │   ├── fleet.ts    # High-level Fleet API
│   │   └── cursor-api.ts   # Direct Cursor API client
│   ├── triage/         # AI-powered analysis
│   │   └── analyzer.ts # Multi-provider AI analysis
│   ├── github/         # Token-aware GitHub ops
│   │   └── client.ts   # Multi-org GitHub client
│   ├── handoff/        # Agent continuity
│   │   └── manager.ts  # Handoff protocols
│   ├── cli.ts          # Command-line interface
│   └── index.ts        # Main exports
└── tests/
```

## Security

This package is designed with security in mind:

- **No hardcoded values** - All tokens and organizations are user-configured
- **Safe subprocess execution** - Uses `spawnSync` instead of shell interpolation
- **Token sanitization** - Tokens are never logged or exposed in error messages
- **ReDoS protection** - Regex patterns are designed to prevent denial of service
- **No credential patterns in docs** - We don't document third-party API key formats

## Development

```bash
# Install dependencies
pnpm install

# Run CLI from source (no build required)
pnpm run agentic

# Build
pnpm run build

# Test
pnpm test

# Watch mode
pnpm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure `pnpm test` passes
5. Create a pull request

## License

MIT © [Jon Bogaty](https://github.com/jbcom)

---

**Part of the [jbcom-oss-ecosystem](https://github.com/jbcom/jbcom-oss-ecosystem)**

