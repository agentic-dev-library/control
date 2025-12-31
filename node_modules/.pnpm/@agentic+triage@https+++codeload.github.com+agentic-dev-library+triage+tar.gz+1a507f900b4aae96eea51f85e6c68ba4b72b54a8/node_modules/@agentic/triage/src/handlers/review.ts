import { generateObject, type LanguageModel } from 'ai';
import { codeReviewSchema } from '../schemas/index.js';

/**
 * Review a pull request or code snippet using the provided language model.
 *
 * @param code - The code or PR diff to review
 * @param model - The Vercel AI SDK model to use
 * @returns The structured review result
 */
export async function reviewCode(code: string, model: LanguageModel) {
    if (!code) {
        throw new Error('Code or diff is required');
    }

    const result = await generateObject({
        model,
        schema: codeReviewSchema,
        prompt: `Review the following code or diff and provide a summary and specific comments:\n\n${code}`,
    });

    return result.object;
}
