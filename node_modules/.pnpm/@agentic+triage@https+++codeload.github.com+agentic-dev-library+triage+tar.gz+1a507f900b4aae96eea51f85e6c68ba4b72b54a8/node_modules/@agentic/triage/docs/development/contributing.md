# Contributing

Thank you for your interest in contributing to PACKAGE_NAME!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/jbcom/PACKAGE_NAME.git
cd PACKAGE_NAME

# Install with all development dependencies
uv sync --all-extras
```

## Running Tests

```bash
# Run tests
uv run pytest

# Run with coverage
uv run pytest --cov=PACKAGE_NAME
```

## Code Style

This project uses:
- [Ruff](https://docs.astral.sh/ruff/) for linting and formatting
- Type hints throughout

```bash
# Check code style
uv run ruff check .
uv run ruff format --check .

# Auto-fix issues
uv run ruff check --fix .
uv run ruff format .
```

## Building Documentation

```bash
# Install docs dependencies
uv sync --extra docs

# Build docs
cd docs
uv run sphinx-build -b html . _build/html

# Or use make
make html
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with tests
3. Ensure CI passes (lint + tests)
4. Submit PR - an AI agent will review and merge

## Commit Messages

Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Maintenance tasks
