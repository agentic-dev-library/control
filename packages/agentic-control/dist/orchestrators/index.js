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
export { CrewTool, CrewToolError } from '../crews/index.js';
export { CursorAPI, Fleet } from '../fleet/index.js';
//# sourceMappingURL=index.js.map