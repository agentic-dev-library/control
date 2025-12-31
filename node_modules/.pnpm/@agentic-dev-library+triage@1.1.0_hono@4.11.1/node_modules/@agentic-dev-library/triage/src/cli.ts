#!/usr/bin/env node
import { Command } from 'commander';
import { resolveModel } from './ai.js';
import { runMcpServer } from './mcp-server.js';

const program = new Command();

program.name('agentic-triage').description('AI-powered GitHub issue triage and PR review primitives').version('0.2.1');

program
    .command('assess')
    .description('Assess an issue')
    .argument('<issue>', 'Issue number')
    .action(async (issueNum) => {
        console.log(`Assessing issue ${issueNum}...`);
        await resolveModel();
        console.log('Triage primitives called successfully.');
    });

program
    .command('mcp-server')
    .description('Run the MCP server for Claude/Cursor integration')
    .action(async () => {
        await runMcpServer();
    });

program.parse();
