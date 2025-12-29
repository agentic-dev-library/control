# agentic-control Docker Image
# Provides both agentic-control (TypeScript) and agentic-crew (Python)
# for AI agent fleet management and crew orchestration

# ============================================
# Stage 1: Build Node.js packages
# ============================================
FROM node:22-slim AS node-builder

# Install system dependencies for building
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@9

USER node
WORKDIR /home/node/app

# Copy package files for dependency installation
COPY --chown=node:node package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --chown=node:node packages/agentic-control/package.json ./packages/agentic-control/
COPY --chown=node:node packages/providers/package.json ./packages/providers/
COPY --chown=node:node packages/vitest-agentic-control/package.json ./packages/vitest-agentic-control/
COPY --chown=node:node scripts/ ./scripts/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY --chown=node:node packages/ ./packages/
RUN pnpm run build

# ============================================
# Stage 2: Final image with Python base + Node.js
# ============================================
FROM python:3.13-slim AS final

# Install Node.js binaries from node:22-slim
COPY --from=node:22-slim /usr/local/bin/node /usr/local/bin/
COPY --from=node:22-slim /usr/local/lib/node_modules /usr/local/lib/node_modules

# Create symlinks for npm and npx
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    jq \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | \
    dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | \
    tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && apt-get install -y gh && \
    rm -rf /var/lib/apt/lists/*

# Install uv (fast Python package manager)
RUN pip install --no-cache-dir uv

# Install pnpm
RUN npm install -g pnpm@9

# Create non-root user for security
RUN useradd -m -u 1000 -s /bin/bash agent
USER agent
WORKDIR /home/agent

# Setup pnpm for global installs
ENV PNPM_HOME="/home/agent/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN mkdir -p "$PNPM_HOME"

# Copy built Node.js packages from builder stage
COPY --from=node-builder --chown=agent:agent /home/node/app/ ./

# Install agentic-crew with AI framework support
RUN pip install --user --no-cache-dir "agentic-crew[crewai]"

# Create global symlinks for CLI commands
RUN ln -s /home/agent/packages/agentic-control/dist/cli.js "$PNPM_HOME/agentic" && \
    ln -s /home/agent/packages/agentic-control/dist/cli.js "$PNPM_HOME/agentic-control" && \
    chmod +x /home/agent/packages/agentic-control/dist/cli.js

# Verify installation
RUN node /home/agent/packages/agentic-control/dist/cli.js --version || echo "CLI version check skipped"

# Add user local bin to PATH for agentic-crew CLI
ENV PATH="/home/agent/.local/bin:${PATH}"

# Default working directory for agent tasks
WORKDIR /workspace

# Verify installation
RUN /home/agent/.local/bin/agentic-crew --help && \
    node /home/agent/packages/agentic-control/dist/cli.js --help

# Entry point: agentic-control CLI
ENTRYPOINT ["node", "/home/agent/packages/agentic-control/dist/cli.js"]
CMD ["--help"]
