# Project Structure

## Root Layout

```
agentic-control/
├── src/                    # TypeScript source code
├── python/                 # Python CrewAI package
├── tests/                  # TypeScript tests
├── docs/                   # Sphinx documentation
├── memory-bank/            # Active context tracking
├── .github/                # GitHub Actions workflows
└── dist/                   # TypeScript build output (generated)
```

## TypeScript Source (`src/`)

```
src/
├── core/                   # Shared utilities and types
│   ├── types.ts           # Core type definitions
│   ├── tokens.ts          # Intelligent token switching
│   ├── config.ts          # Configuration management
│   └── providers.ts       # AI provider setup
├── fleet/                  # Agent fleet management
│   ├── fleet.ts           # High-level Fleet API
│   └── cursor-api.ts      # Cursor API client
├── triage/                 # AI-powered analysis
│   ├── analyzer.ts        # Multi-provider AI analysis
│   ├── agent.ts           # Triage agent
│   ├── resolver.ts        # Issue resolution
│   └── types.ts           # Triage types
├── crews/                  # CrewAI integration (optional)
│   ├── crew-tool.ts       # Crew invocation via subprocess
│   ├── types.ts           # Crew types and validation
│   └── index.ts           # Crew exports
├── github/                 # GitHub operations
│   └── client.ts          # Token-aware GitHub client
├── handoff/                # Agent continuity
│   └── manager.ts         # Handoff protocols
├── cli.ts                  # CLI entry point
└── index.ts                # Main exports
```

### Module Exports
Each module has an `index.ts` that exports public APIs:
- `src/core/index.ts` - Core utilities
- `src/fleet/index.ts` - Fleet management
- `src/triage/index.ts` - Triage functionality
- `src/crews/index.ts` - CrewAI integration (optional)
- `src/github/index.ts` - GitHub operations
- `src/handoff/index.ts` - Handoff management

## Python Source (`python/src/crew_agents/`)

```
python/src/crew_agents/
├── core/                   # Core engine
│   ├── discovery.py       # Discover .crewai/ directories
│   ├── loader.py          # Load crew configs from YAML
│   └── runner.py          # Execute crews
├── base/                   # Reusable components
│   └── archetypes.yaml    # Agent templates
├── config/                 # Configuration
│   ├── agents.yaml        # Agent definitions
│   ├── tasks.yaml         # Task definitions
│   └── llm.py             # LLM configuration
├── crews/                  # Specialized crews
│   ├── game_builder/      # Game component builder
│   ├── creature_design/   # Creature design crew
│   ├── world_design/      # World design crew
│   ├── asset_pipeline/    # Asset generation
│   ├── ecs_implementation/ # ECS implementation
│   ├── gameplay_design/   # Gameplay design
│   ├── qa_validation/     # QA validation
│   └── rendering/         # Rendering crew
├── flows/                  # Orchestrated workflows
│   ├── game_design_flow.py
│   ├── implementation_flow.py
│   ├── asset_generation_flow.py
│   └── ...
├── tools/                  # Utility tools
│   └── file_tools.py      # File operations
├── __init__.py            # Package exports
├── __main__.py            # CLI entry point
├── main.py                # Main CLI
└── crew.py                # Crew runner
```

### Crew Structure
Each crew follows this pattern:
```
crews/<crew_name>/
├── __init__.py
├── <crew_name>_crew.py    # Crew implementation
└── config/
    ├── agents.yaml        # Agent definitions
    └── tasks.yaml         # Task definitions
```

## Tests

### TypeScript Tests (`tests/`)
- `tokens.test.ts` - Token management tests
- Uses vitest framework

### Python Tests (`python/tests/`)
- `test_discovery.py` - Discovery tests
- `test_loader.py` - Loader tests
- `test_flows.py` - Flow tests
- `test_file_tools.py` - Tool tests
- `conftest.py` - Pytest configuration

## Documentation (`docs/`)

```
docs/
├── api/                    # API documentation
│   ├── python/            # Python API docs
│   └── typescript/        # TypeScript API docs
├── development/            # Development guides
│   ├── architecture.md
│   └── contributing.md
├── getting-started/        # User guides
│   ├── installation.md
│   └── quickstart.md
├── conf.py                 # Sphinx configuration
└── index.rst               # Documentation index
```

## Configuration Files

### Root Level
- `package.json` - TypeScript package metadata
- `tsconfig.json` - TypeScript compiler config
- `pnpm-lock.yaml` - pnpm lockfile
- `.prettierrc` - Prettier config
- `.prettierignore` - Prettier ignore patterns
- `.gitignore` - Git ignore patterns

### Python Directory
- `python/pyproject.toml` - Python package metadata
- `python/uv.lock` - uv lockfile
- `python/crewbase.yaml` - CrewAI configuration

## Build Artifacts (Generated)

- `dist/` - TypeScript compiled output
- `python/.venv/` - Python virtual environment
- `python/src/crew_agents/__pycache__/` - Python bytecode

## Naming Conventions

### TypeScript
- Files: kebab-case (`cursor-api.ts`)
- Classes: PascalCase (`Fleet`, `AIAnalyzer`)
- Functions: camelCase (`getTokenForRepo`)
- Constants: UPPER_SNAKE_CASE (`VERSION`)

### Python
- Files: snake_case (`discovery.py`)
- Classes: PascalCase (`GameDesignFlow`)
- Functions: snake_case (`load_manifest`)
- Constants: UPPER_SNAKE_CASE (`__version__`)

## Import Patterns

### TypeScript
```typescript
// Use .js extension for local imports (ES modules)
import { Fleet } from './fleet/index.js';

// External packages
import { Octokit } from '@octokit/rest';
```

### Python
```python
# Absolute imports from package root
from crew_agents.core import discovery
from crew_agents.crews import GameBuilderCrew

# Relative imports within modules
from .loader import load_manifest
```
