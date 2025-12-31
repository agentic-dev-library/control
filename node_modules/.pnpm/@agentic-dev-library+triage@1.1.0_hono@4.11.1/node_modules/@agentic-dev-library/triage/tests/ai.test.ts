import { beforeEach, describe, expect, it, vi } from 'vitest';

const { generateTextMock, ollamaFn, createOllamaFn } = vi.hoisted(() => {
    const generateTextMock = vi.fn(async (args: any) => {
        // Provide the shape used by ai.ts
        return {
            text: `echo:${args.prompt ?? ''}`,
            finishReason: 'stop',
            steps: [
                {
                    toolCalls: [{ name: 't1' }],
                    toolResults: [{ name: 't1', result: 123 }],
                    text: 'step text',
                },
            ],
        };
    });

    const ollamaFn = vi.fn((modelId: string) => ({ provider: 'ollama', modelId }));
    const createOllamaFn = vi.fn((_opts: any) => (modelId: string) => ({ provider: 'ollama-custom', modelId }));

    return { generateTextMock, ollamaFn, createOllamaFn };
});

// Note: vi.mock() factories are hoisted, so they must only reference hoisted vars.
vi.mock('ai', async () => {
    return {
        generateText: (...args: any[]) => generateTextMock(...args),
        tool: (cfg: any) => ({ ...cfg, __tool: true }),
        stepCountIs: (n: number) => ({ __stopAfter: n }),
    };
});

vi.mock('ai-sdk-ollama', async () => {
    return {
        ollama: ollamaFn,
        createOllama: createOllamaFn,
    };
});

// Provide the shape used by ai.ts
// (kept here to make intent obvious to future edits)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
generateTextMock.mockImplementation(async (args: any) => {
    // Provide the shape used by ai.ts
    const result = {
        text: `echo:${args.prompt ?? ''}`,
        finishReason: 'stop',
        steps: [
            {
                toolCalls: [{ name: 't1' }],
                toolResults: [{ name: 't1', result: 123 }],
                text: 'step text',
            },
        ],
    };

    // Simulate the AI SDK invoking onStepFinish
    if (typeof args.onStepFinish === 'function') {
        await args.onStepFinish(result.steps[0]);
    }

    return result;
});

import { createTool, DEFAULT_MODEL, generate, generateWithTools, getModel, getProvider } from '../src/ai.ts';

describe('ai', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.OLLAMA_API_KEY;
        delete process.env.OLLAMA_HOST;
        delete process.env.OLLAMA_MODEL;
    });

    it('getModel prefers config then env then default', () => {
        expect(getModel()).toBe(DEFAULT_MODEL);
        process.env.OLLAMA_MODEL = 'm1';
        expect(getModel()).toBe('m1');
        expect(getModel({ model: 'm2' })).toBe('m2');
    });

    it('getProvider returns default provider when no key/host set', () => {
        const provider = getProvider();
        expect(provider).toBe(ollamaFn);
        expect(createOllamaFn).not.toHaveBeenCalled();
    });

    it('getProvider normalizes host and uses Authorization when apiKey is present', () => {
        const provider = getProvider({ apiKey: 'k', host: 'https://ollama.com' });
        expect(createOllamaFn).toHaveBeenCalledTimes(1);
        // should return the created provider function
        expect(provider('m')).toEqual({ provider: 'ollama-custom', modelId: 'm' });
    });

    it('generate delegates to generateText with model from provider(modelId)', async () => {
        process.env.OLLAMA_MODEL = 'test-model';

        const out = await generate('hello', { systemPrompt: 'sys', temperature: 0.1, maxTokens: 5 });

        expect(out).toBe('echo:hello');
        expect(generateTextMock).toHaveBeenCalledTimes(1);
        const call = generateTextMock.mock.calls[0][0];
        expect(call.model).toEqual({ provider: 'ollama', modelId: 'test-model' });
        expect(call.system).toBe('sys');
        expect(call.prompt).toBe('hello');
    });

    it('generateWithTools aggregates tool calls/results and forwards onStepFinish', async () => {
        const onStepFinish = vi.fn();
        const res = await generateWithTools(
            'p',
            { someTool: { description: 'x', execute: async () => 1 } },
            { maxSteps: 3, onStepFinish }
        );

        expect(res.text).toBe('echo:p');
        expect(res.toolCalls).toEqual([{ name: 't1' }]);
        expect(res.toolResults).toEqual([{ name: 't1', result: 123 }]);
        expect(onStepFinish).toHaveBeenCalledTimes(1);
        expect(generateTextMock.mock.calls[0][0].stopWhen).toEqual({ __stopAfter: 3 });
    });

    it('createTool wraps ai.tool with schema + execute', async () => {
        const t = createTool({
            description: 'desc',
            // minimal schema shape for this test
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            inputSchema: { _def: { typeName: 'ZodObject' } } as any,
            execute: async (input) => input,
        });

        expect(t.__tool).toBe(true);
        expect(t.description).toBe('desc');
        expect(typeof t.execute).toBe('function');
    });
});
