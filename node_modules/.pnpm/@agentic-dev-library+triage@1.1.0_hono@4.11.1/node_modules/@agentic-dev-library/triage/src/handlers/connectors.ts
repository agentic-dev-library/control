import { TriageConnectors } from '../triage/connectors.js';

let _connectors: TriageConnectors | null = null;

/**
 * Get the global TriageConnectors instance
 * @param customConnectors Optional custom connectors to use
 * @returns The TriageConnectors instance
 */
export function getConnectors(customConnectors?: TriageConnectors): TriageConnectors {
    if (customConnectors) return customConnectors;
    if (!_connectors) {
        _connectors = new TriageConnectors();
    }
    return _connectors;
}

/**
 * Set the global TriageConnectors instance
 * @param connectors The connectors instance to set
 */
export function setConnectors(connectors: TriageConnectors | null): void {
    _connectors = connectors;
}
