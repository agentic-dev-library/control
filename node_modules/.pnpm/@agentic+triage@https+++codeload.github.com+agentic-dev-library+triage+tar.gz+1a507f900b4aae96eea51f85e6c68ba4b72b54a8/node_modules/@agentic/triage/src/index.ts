/**
 * @agentic/triage
 *
 * Portable triage primitives for AI agents.
 *
 * This package provides provider-agnostic building blocks for:
 * - Sigma-weighted complexity evaluation
 * - Intelligent task routing
 * - Priority queue management
 * - Escalation logic
 *
 * All primitives are designed to work with ANY LLM/agent provider.
 * Actual provider implementations belong in @agentic/control.
 */

// Core triage handlers and tools
export * from './handlers/index.js';
export * from './providers/index.js';
// NEW: Queue management primitives
export * from './queue/index.js';
export * from './schemas/index.js';
// NEW: Sigma-weighted scoring system
export * from './scoring/index.js';
export * from './tools/index.js';
export * from './triage/index.js';
