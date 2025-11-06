#!/usr/bin/env node

/**
 * Production CLI
 *
 * Simple, reliable command-line interface using yargs
 * Proper error handling and user feedback
 */

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import ora from 'ora';
import { getContainer } from './application/container';
import logger from './infrastructure/logger';
import { SearchOptions } from './domain/types';

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const argv = await yargs(hideBin(process.argv))
    .command('$0 <description>', 'Search for available domain names', (yargs) => {
      return yargs
        .positional('description', {
          describe: 'Project description',
          type: 'string'
        })
        .option('tlds', {
          alias: 't',
          describe: 'TLDs to check (comma-separated)',
          type: 'string',
          default: '.com,.io,.dev,.co,.net'
        })
        .option('max', {
          alias: 'm',
          describe: 'Maximum suggestions',
          type: 'number',
          default: 15
        })
        .option('min-score', {
          alias: 's',
          describe: 'Minimum quality score (0-100)',
          type: 'number',
          default: 60
        })
        .option('no-cache', {
          describe: 'Disable caching',
          type: 'boolean',
          default: false
        })
        .option('json', {
          describe: 'Output JSON format',
          type: 'boolean',
          default: false
        })
        .example('$0 "AI task manager"', 'Search for domains for an AI task manager')
        .example('$0 "cloud storage" -t .com,.io -m 20', 'Search with specific TLDs and max suggestions');
    })
    .version()
    .help()
    .alias('help', 'h')
    .alias('version', 'v')
    .strict()
    .parse();

  try {
    const description = argv.description as string;

    if (!description || description.trim().length === 0) {
      console.error(chalk.red('Error: Description is required\n'));
      process.exit(1);
    }

    // Parse options
    const tlds = (argv.tlds as string).split(',').map(t => {
      const trimmed = t.trim();
      return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
    });

    const options: SearchOptions = {
      tlds,
      useCache: !argv['no-cache'],
      generatorOptions: {
        maxSuggestions: argv.max as number,
        minScore: argv['min-score'] as number
      }
    };

    // JSON output mode (for scripting)
    if (argv.json) {
      const container = getContainer();
      const results = await container.searchService.search(description, options);
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    // Interactive mode with spinner and formatted output
    console.log(chalk.bold.cyan('\n🚀 Domain Name Brainstormer\n'));
    console.log(chalk.gray(`Query: "${description}"`));
    console.log(chalk.gray(`Min Score: ${options.generatorOptions?.minScore}/100`));
    console.log(chalk.gray(`TLDs: ${tlds.join(', ')}\n`));

    const spinner = ora('Generating suggestions...').start();

    // Get container and run search
    const container = getContainer();
    const results = await container.searchService.search(description, options);

    spinner.succeed('Search complete!\n');

    // Display summary
    console.log(chalk.bold('📊 SUMMARY:\n'));
    console.log(`  Total checked: ${chalk.bold(results.summary.totalChecked.toString())}`);
    console.log(`  ${chalk.green('Available:')} ${results.summary.available}`);
    console.log(`  ${chalk.red('Registered:')} ${results.summary.registered}`);
    console.log(`  ${chalk.yellow('Unknown:')} ${results.summary.unknown}`);
    console.log(`  Average score: ${results.summary.averageScore}/100`);
    console.log(`  Duration: ${(results.summary.duration / 1000).toFixed(2)}s\n`);

    // Display available domains
    const available = results.results.filter(r => r.availability.available === true);

    if (available.length > 0) {
      console.log(chalk.bold.green('✅ AVAILABLE DOMAINS:\n'));

      available.forEach((result) => {
        const scoreColor = result.score >= 80 ? chalk.green :
                          result.score >= 70 ? chalk.blue :
                          result.score >= 60 ? chalk.yellow :
                          chalk.gray;

        const cached = result.availability.cached ? chalk.gray(' [cached]') : '';

        console.log(
          `  ${chalk.bold(result.domain)} ` +
          scoreColor(`[${result.scoring.grade}]`) +
          chalk.gray(` (${result.score}/100)`) +
          cached
        );
      });

      console.log();
    } else {
      console.log(chalk.yellow('⚠️  No available domains found\n'));
      console.log(chalk.gray('💡 Try:'));
      console.log(chalk.gray('  • Lowering --min-score'));
      console.log(chalk.gray('  • Using different TLDs with --tlds'));
      console.log(chalk.gray('  • Trying a different description\n'));
    }

    // Show some registered domains
    const registered = results.results.filter(r => r.availability.available === false);

    if (registered.length > 0 && registered.length <= 10) {
      console.log(chalk.bold.red('❌ REGISTERED DOMAINS (sample):\n'));

      registered.slice(0, 5).forEach((result) => {
        console.log(`  ${chalk.dim(result.domain)}`);
      });

      console.log();
    }

    // Tips
    if (available.length === 0) {
      console.log(chalk.bold.cyan('💡 TIPS:\n'));
      console.log(chalk.gray('  • Domain availability changes constantly'));
      console.log(chalk.gray('  • Always verify on a registrar before purchasing'));
      console.log(chalk.gray('  • Check trademark databases\n'));
    }

  } catch (error) {
    logger.error('CLI error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    console.error(chalk.red('\n✗ Error:'), error instanceof Error ? error.message : 'Unknown error');
    console.error(chalk.gray('\nRun with --help for usage information\n'));

    process.exit(1);
  }
}

// Run CLI
main();
