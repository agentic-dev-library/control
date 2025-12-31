#!/usr/bin/env node
import { Command } from 'commander';
import { resolveModel } from './ai.js';

const program = new Command();

program.name('triage').description('AI-powered GitHub issue triage and PR review primitives').version('0.2.1');

program
    .command('assess')
    .description('Assess an issue')
    .argument('<issue>', 'Issue number')
    .action(async (issueNum) => {
        console.log(`Assessing issue ${issueNum}...`);
        // Implementation using primitives
        await resolveModel();
        // For assessment, we'd typically fetch the issue first
        console.log('Triage primitives called successfully.');
    });

program.parse();
