# @agentic-dev-library/triage Docker Image
# AI-powered GitHub issue triage, PR review, and sprint planning CLI
# Includes triage primitives for issue/PR management

# =============================================================================
# Stage 1: Build stage
# =============================================================================
FROM node:25-slim AS builder

WORKDIR /build

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Build
RUN pnpm run build

# =============================================================================
# Stage 2: Production image
# =============================================================================
FROM node:25-slim AS production

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

# Install pnpm
RUN npm install -g pnpm

# Create non-root user for security
# Use UID 1001 to avoid conflicts with existing users in base image
RUN useradd -m -u 1001 -s /bin/bash triage
RUN mkdir -p /home/triage && chown triage:triage /home/triage
USER triage
WORKDIR /home/triage

# Copy built files and package info from builder
COPY --from=builder --chown=triage:triage /build/dist ./dist
COPY --from=builder --chown=triage:triage /build/package.json ./package.json
COPY --from=builder --chown=triage:triage /build/pnpm-lock.yaml ./pnpm-lock.yaml

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Setup path for triage command
ENV PATH="/home/triage/node_modules/.bin:$PATH"
# Link the local package so it's available as 'triage'
RUN pnpm link .

# Default working directory
WORKDIR /workspace

# Entry point
ENTRYPOINT ["triage"]
CMD ["--help"]

# =============================================================================
# Usage Examples:
# =============================================================================
#
# Build:
#   docker build -t agentic-triage .
#
# Assess an issue:
#   docker run --rm \
#     -e GH_TOKEN=$GH_TOKEN \
#     -e OLLAMA_API_KEY=$OLLAMA_API_KEY \
#     agentic-triage assess 123 --repo owner/repo
#
# Review a PR:
#   docker run --rm \
#     -e GH_TOKEN=$GH_TOKEN \
#     -e OLLAMA_API_KEY=$OLLAMA_API_KEY \
#     agentic-triage review 456 --repo owner/repo
#
# Sprint planning:
#   docker run --rm \
#     -e GH_TOKEN=$GH_TOKEN \
#     -e OLLAMA_API_KEY=$OLLAMA_API_KEY \
#     agentic-triage sprint --repo owner/repo
#
# Interactive shell:
#   docker run --rm -it --entrypoint bash agentic-triage
#
# =============================================================================
