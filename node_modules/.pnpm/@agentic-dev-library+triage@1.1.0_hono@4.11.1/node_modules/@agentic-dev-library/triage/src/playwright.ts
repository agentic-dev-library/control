/**
 * Playwright MCP Client
 *
 * Connects to @playwright/mcp for browser automation and E2E test generation.
 * Used for:
 * - Running E2E tests
 * - Generating test code from user flows
 * - Verifying changes in the browser
 */

import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';

export type MCPClient = Awaited<ReturnType<typeof createMCPClient>>;

export interface PlaywrightOptions {
    headless?: boolean;
    browser?: 'chromium' | 'firefox' | 'webkit';
    viewport?: { width: number; height: number };
    outputDir?: string;
    saveTrace?: boolean;
    testingCapabilities?: boolean;
}

/**
 * Create a Playwright MCP client
 */
export async function createPlaywrightClient(options: PlaywrightOptions = {}): Promise<MCPClient> {
    const {
        headless = true,
        browser = 'chromium',
        outputDir = './test-output',
        saveTrace = false,
        testingCapabilities = true,
    } = options;

    const args = ['@playwright/mcp@latest'];

    if (headless) args.push('--headless');
    args.push('--browser', browser);
    args.push('--output-dir', outputDir);

    if (saveTrace) args.push('--save-trace');
    if (testingCapabilities) args.push('--caps=testing');

    const transport = new StdioMCPTransport({
        command: 'npx',
        args,
    });

    const client = await createMCPClient({
        transport,
        name: 'strata-triage-playwright',
        version: '1.0.0',
    });

    return client;
}

/**
 * Get Playwright tools from the MCP client
 */
export async function getPlaywrightTools(client: MCPClient): Promise<Awaited<ReturnType<MCPClient['tools']>>> {
    return client.tools();
}

/**
 * Available Playwright MCP tools (for reference)
 */
export const PLAYWRIGHT_TOOLS = {
    // Core automation
    NAVIGATE: 'browser_navigate',
    CLICK: 'browser_click',
    TYPE: 'browser_type',
    SNAPSHOT: 'browser_snapshot',
    SCREENSHOT: 'browser_take_screenshot',
    CLOSE: 'browser_close',
    WAIT: 'browser_wait_for',
    EVALUATE: 'browser_evaluate',

    // Testing assertions (requires --caps=testing)
    VERIFY_ELEMENT_VISIBLE: 'browser_verify_element_visible',
    VERIFY_TEXT_VISIBLE: 'browser_verify_text_visible',
    VERIFY_VALUE: 'browser_verify_value',
    GENERATE_LOCATOR: 'browser_generate_locator',
} as const;
