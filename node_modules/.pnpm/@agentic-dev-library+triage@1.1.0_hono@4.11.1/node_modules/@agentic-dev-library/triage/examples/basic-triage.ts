import { ollama } from 'ai-sdk-ollama';
import { analyzeIssue } from '../src/index.js';

/**
 * Basic example of using the analyzeIssue handler.
 */
async function main() {
    const issueBody = `
    Title: Bug in the login flow
    Description: Users are unable to login when using special characters in their passwords.
    Steps to reproduce:
    1. Go to login page
    2. Enter email
    3. Enter password with !@#$%
    4. Click login
    Actual result: Error 500
    Expected result: Successful login
  `;

    // Use a local Ollama model
    const model = ollama('llama3');

    console.log('Analyzing issue...');

    try {
        const result = await analyzeIssue(issueBody, model as any);
        console.log('Analysis result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error analyzing issue:', error);
    }
}

main();
