#!/bin/bash
# =============================================================================
# agentic-control entrypoint
# =============================================================================
# Supports multiple modes:
#   1. CLI mode (default): Run agentic CLI commands
#   2. Sandbox mode: Execute agent in isolated environment
# =============================================================================

set -euo pipefail

# Detect mode from first argument
MODE="${1:-cli}"

case "$MODE" in
  sandbox)
    # Shift off 'sandbox' and run sandbox executor
    shift
    exec node /app/dist/sandbox/execute.js "$@"
    ;;
  --help|-h)
    echo "agentic-control - AI Agent Fleet Management"
    echo ""
    echo "Usage:"
    echo "  agentic [command] [options]     Run CLI command"
    echo "  agentic sandbox [options]       Execute agent in sandbox"
    echo ""
    echo "Commands:"
    echo "  fleet       Manage agent fleet (remote + local)"
    echo "  triage      Triage and recover agents"
    echo "  sandbox     Execute in isolated container (local)"
    echo "  github      GitHub integration"
    echo "  handoff     Agent handoff operations"
    echo ""
    exec agentic --help
    ;;
  *)
    # Default: pass through to agentic CLI
    exec agentic "$@"
    ;;
esac
