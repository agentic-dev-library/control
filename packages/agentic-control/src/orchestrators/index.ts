/**
 * Multi-agent orchestration module
 *
 * Provides intelligent routing and coordination between different AI agents:
 * - Ollama: Local model orchestration
 * - Jules: Enterprise agent coordination
 * - Cursor: IDE-integrated agent management
 *
 * Re-exports fleet and crew management for orchestration layer
 */

// Re-export crew integration for Python crewai orchestration
export type {
  CrewInfo,
  CrewListResponse,
  CrewResult,
  CrewToolConfig,
  InvokeCrewOptions,
} from '../crews/index.js';
export { CrewTool, CrewToolError, type CrewToolErrorCategory } from '../crews/index.js';
// Re-export fleet management for multi-agent routing
export type { CoordinationConfig, FleetConfig, SpawnContext } from '../fleet/index.js';
export { CursorAPI, type CursorAPIOptions, Fleet } from '../fleet/index.js';
