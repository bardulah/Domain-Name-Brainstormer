#!/usr/bin/env node

/**
 * Enhanced Domain Name Brainstormer CLI V2
 * Features:
 * - Progressive result display
 * - Interactive selection mode
 * - Social handle checking
 * - Export to JSON/CSV
 * - Quality scoring
 */

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const Table = require('cli-table3');
const DomainGeneratorV2 = require('./domainGeneratorV2');
const AvailabilityCheckerV2 = require('./availabilityCheckerV2');
const SocialChecker = require('./utils/socialChecker');
const Exporter = require('./utils/exporter');

// Parse command line arguments
const args = process.argv.slice(2);

const HELP_TEXT = `
${chalk.bold.cyan('Domain Name Brainstormer V2')} ${chalk.gray('- Enhanced Edition')}

${chalk.bold('USAGE:')}
  domain-brainstorm <description> [options]
  node cliV2.js <description> [options]

${chalk.bold('OPTIONS:')}
  --quick, -q          Quick mode (10 suggestions, 3 TLDs)
  --max <n>           Maximum suggestions (default: 20)
  --min-score <n>     Minimum quality score 0-100 (default: 55)
  --tlds <list>       Comma-separated TLDs (default: .com,.io,.dev,.co,.net,.app,.ai)
  --social            Check social handle availability
  --interactive, -i   Interactive selection mode
  --export <format>   Export results (json, csv, md)
  --output <file>     Output filename for export
  --no-cache          Disable availability caching
  --cache-stats       Show cache statistics
  --help, -h          Show this help

${chalk.bold('EXAMPLES:')}
  node cliV2.js "AI task manager" --social --interactive
  node cliV2.js "cloud storage" --min-score 70 --export json
  node cliV2.js "developer tools" --quick --tlds ".dev,.io"
  node cliV2.js "startup idea" --social --export csv --output results.csv

${chalk.bold('QUALITY GRADES:')}
  A+ (90-100): Premium, highly brandable
  A  (85-89):  Excellent quality
  B  (70-84):  Good, suitable for most projects
  C  (55-69):  Acceptable
  D  (<55):    Filtered out by default
`;

// Show help
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(HELP_TEXT);
  process.exit(0);
}

// Parse options
const options = {
  quick: args.includes('--quick') || args.includes('-q'),
  social: args.includes('--social'),
  interactive: args.includes('--interactive') || args.includes('-i'),
  noCache: args.includes('--no-cache'),
  cacheStats: args.includes('--cache-stats'),
  maxSuggestions: 20,
  minScore: 55,
  tlds: null,
  export: null,
  output: null
};

// Parse numeric options
const parseOption = (flag, defaultValue) => {
  const index = args.findIndex(arg => arg === flag);
  if (index !== -1 && args[index + 1]) {
    const value = parseInt(args[index + 1]);
    return isNaN(value) ? defaultValue : value;
  }
  return defaultValue;
};

options.maxSuggestions = parseOption('--max', options.quick ? 10 : 20);
options.minScore = parseOption('--min-score', 55);

// Parse TLDs
const tldsIndex = args.findIndex(arg => arg === '--tlds');
if (tldsIndex !== -1 && args[tldsIndex + 1]) {
  options.tlds = args[tldsIndex + 1].split(',').map(tld =>
    tld.trim().startsWith('.') ? tld.trim() : '.' + tld.trim()
  );
}

// Parse export format
const exportIndex = args.findIndex(arg => arg === '--export');
if (exportIndex !== -1 && args[exportIndex + 1]) {
  options.export = args[exportIndex + 1].toLowerCase();
}

// Parse output filename
const outputIndex = args.findIndex(arg => arg === '--output');
if (outputIndex !== -1 && args[outputIndex + 1]) {
  options.output = args[outputIndex + 1];
}

// Get description
const description = args
  .filter(arg => !arg.startsWith('--') && !arg.startsWith('-'))
  .filter((arg, i, arr) => {
    const prevIndex = args.indexOf(arg) - 1;
    if (prevIndex >= 0) {
      const prevArg = args[prevIndex];
      return !['--max', '--min-score', '--tlds', '--export', '--output'].includes(prevArg);
    }
    return true;
  })
  .join(' ')
  .trim();

if (!description) {
  console.log(chalk.red('\n✗ Error: Please provide a project description\n'));
  console.log('Run with --help for usage information\n');
  process.exit(1);
}

/**
 * Display progressive results as they come in
 */
function displayProgress(result) {
  const symbol = result.available === true ? chalk.green('✓') :
                 result.available === false ? chalk.red('✗') :
                 chalk.yellow('?');

  const method = result.cached ? chalk.gray('[cached]') :
                result.method === 'rdap' ? chalk.blue('[rdap]') :
                chalk.gray('[whois]');

  console.log(`${symbol} ${result.domain} ${method}`);
}

/**
 * Create table with results
 */
function createResultsTable(results, includeScore = true) {
  const headers = ['Domain', 'Status'];

  if (includeScore) {
    headers.push('Score', 'Grade');
  }

  if (options.social) {
    headers.push('GitHub', 'Instagram');
  }

  const table = new Table({
    head: headers.map(h => chalk.bold(h)),
    style: { head: [], border: [] }
  });

  for (const result of results.slice(0, 30)) {
    const row = [
      result.available === true ? chalk.green(result.domain) :
      result.available === false ? chalk.red(result.domain) :
      chalk.yellow(result.domain),

      result.available === true ? chalk.green('Available') :
      result.available === false ? chalk.red('Registered') :
      chalk.yellow('Unknown')
    ];

    if (includeScore && result.scoring) {
      const score = result.scoring.overall;
      const grade = result.scoring.grade;

      const scoreColor = score >= 85 ? chalk.green :
                        score >= 70 ? chalk.blue :
                        score >= 55 ? chalk.yellow :
                        chalk.gray;

      row.push(scoreColor(score.toString()), scoreColor(grade));
    } else if (includeScore) {
      row.push('N/A', 'N/A');
    }

    if (options.social && result.social) {
      const github = result.social.find(s => s.platform === 'GitHub');
      const instagram = result.social.find(s => s.platform === 'Instagram');

      row.push(
        github?.available === true ? chalk.green('✓') :
        github?.available === false ? chalk.red('✗') :
        chalk.gray('?'),

        instagram?.available === true ? chalk.green('✓') :
        instagram?.available === false ? chalk.red('✗') :
        chalk.gray('?')
      );
    }

    table.push(row);
  }

  return table.toString();
}

/**
 * Interactive selection mode
 */
async function interactiveMode(results) {
  const available = results.filter(r => r.available === true);

  if (available.length === 0) {
    console.log(chalk.yellow('\n⚠️  No available domains to select from\n'));
    return;
  }

  const choices = available.map(r => ({
    name: `${r.domain} (Score: ${r.scoring?.overall || 'N/A'}, Grade: ${r.scoring?.grade || 'N/A'})`,
    value: r.domain,
    short: r.domain
  }));

  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select domains for detailed information:',
      choices,
      pageSize: 15
    }
  ]);

  if (answers.selected.length > 0) {
    console.log(chalk.bold.cyan('\n📋 Selected Domains:\n'));

    for (const domain of answers.selected) {
      const result = available.find(r => r.domain === domain);

      console.log(chalk.bold.green(`\n✓ ${domain}`));

      if (result.scoring) {
        console.log(chalk.gray('  Quality Scores:'));
        console.log(chalk.gray(`    Overall: ${result.scoring.overall}/100 (${result.scoring.grade})`));
        console.log(chalk.gray(`    Pronounceability: ${result.scoring.breakdown.pronounceability}/100`));
        console.log(chalk.gray(`    Brandability: ${result.scoring.breakdown.brandability}/100`));
        console.log(chalk.gray(`    Memorability: ${result.scoring.breakdown.memorability}/100`));
      }

      if (result.social) {
        console.log(chalk.gray('  Social Handles:'));
        result.social.forEach(s => {
          const status = s.available === true ? chalk.green('Available') :
                        s.available === false ? chalk.red('Taken') :
                        chalk.yellow('Check manually');
          console.log(chalk.gray(`    ${s.platform}: ${status}`));
        });
      }
    }

    // Ask about export
    const exportAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'export',
        message: 'Export selected domains?',
        default: false
      }
    ]);

    if (exportAnswer.export) {
      const formatAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'format',
          message: 'Export format:',
          choices: ['JSON', 'CSV', 'Markdown']
        }
      ]);

      const selectedResults = available.filter(r => answers.selected.includes(r.domain));
      const filename = `selected-domains.${formatAnswer.format.toLowerCase()}`;

      const saved = await Exporter.saveToFile(selectedResults, filename);
      console.log(chalk.green(`\n✓ Exported to ${saved.filename}\n`));
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.bold.cyan('\n🚀 Domain Name Brainstormer V2\n'));
  console.log(chalk.gray(`Project: ${description}`));
  console.log(chalk.gray(`Mode: ${options.quick ? 'Quick' : 'Standard'}`));
  console.log(chalk.gray(`Min Score: ${options.minScore}/100\n`));

  let spinner = ora('Generating domain suggestions...').start();

  try {
    // Step 1: Generate domain names
    const generator = new DomainGeneratorV2();
    const suggestions = generator.generate(description, {
      maxSuggestions: options.maxSuggestions,
      minScore: options.minScore
    });

    spinner.succeed(`Generated ${suggestions.length} high-quality suggestions\n`);

    // Show top suggestions
    console.log(chalk.bold('🎯 Top Suggestions (by quality):\n'));
    suggestions.slice(0, 10).forEach((s, i) => {
      const gradeColor = s.scoring.grade.startsWith('A') ? chalk.green :
                         s.scoring.grade.startsWith('B') ? chalk.blue :
                         chalk.yellow;

      console.log(`  ${i + 1}. ${chalk.bold(s.name)} ${gradeColor(`[${s.scoring.grade}]`)} ${chalk.gray(`(${s.score}/100)`)}`);
    });

    // Step 2: Check availability
    console.log(chalk.bold('\n🔍 Checking Domain Availability...\n'));

    const checker = new AvailabilityCheckerV2({
      maxConcurrent: options.quick ? 5 : 10
    });

    if (options.noCache) {
      checker.clearCache();
    }

    if (options.cacheStats) {
      const stats = checker.getCacheStats();
      console.log(chalk.gray(`Cache: ${stats.valid} valid, ${stats.expired} expired\n`));
    }

    const tlds = options.tlds || (options.quick ?
      ['.com', '.io', '.dev'] :
      ['.com', '.io', '.dev', '.co', '.net', '.app', '.ai']);

    const names = suggestions.map(s => s.name);
    let completed = 0;
    const total = names.length * tlds.length;

    spinner = ora('Checking availability...').start();

    const availabilityResults = await checker.checkAvailability(names, tlds, {
      progressCallback: (current, total) => {
        completed = current;
        const percentage = Math.round((current / total) * 100);
        spinner.text = `Checking availability... ${percentage}% (${current}/${total})`;
      }
    });

    spinner.succeed('Availability check complete!\n');

    // Merge results with scoring
    const mergedResults = availabilityResults.map(ar => {
      const name = ar.domain.split('.')[0];
      const suggestion = suggestions.find(s => s.name === name);
      return {
        ...ar,
        name,
        tld: ar.domain.match(/\.[^.]+$/)?.[0],
        score: suggestion?.score,
        scoring: suggestion?.scoring
      };
    });

    // Step 3: Check social handles (if requested)
    if (options.social) {
      console.log(chalk.bold('🌐 Checking Social Handle Availability...\n'));

      const socialChecker = new SocialChecker();
      const availableDomains = mergedResults.filter(r => r.available === true);
      const uniqueNames = [...new Set(availableDomains.map(r => r.name))];

      spinner = ora('Checking social handles...').start();

      const socialResults = await socialChecker.checkMultipleHandles(
        uniqueNames.slice(0, 10), // Limit to top 10 to avoid rate limiting
        ['github', 'instagram']
      );

      spinner.succeed('Social check complete!\n');

      // Merge social results
      for (const result of mergedResults) {
        if (socialResults.has(result.name)) {
          result.social = socialResults.get(result.name);
        }
      }
    }

    // Group results
    const grouped = checker.groupByStatus(mergedResults);

    // Display summary
    console.log(chalk.bold('📊 SUMMARY:\n'));
    console.log(chalk.gray(`  Total checked: ${mergedResults.length}`));
    console.log(chalk.green(`  Available: ${grouped.available.length}`));
    console.log(chalk.red(`  Registered: ${grouped.registered.length}`));
    console.log(chalk.yellow(`  Unknown: ${grouped.unknown.length}\n`));

    // Display available domains
    if (grouped.available.length > 0) {
      console.log(chalk.bold.green('✅ AVAILABLE DOMAINS:\n'));
      console.log(createResultsTable(grouped.available, true));
      console.log();
    } else {
      console.log(chalk.yellow('⚠️  No available domains found\n'));
    }

    // Interactive mode
    if (options.interactive && grouped.available.length > 0) {
      await interactiveMode(grouped.available);
    }

    // Export results
    if (options.export && !options.interactive) {
      const format = options.export;
      const filename = options.output || Exporter.generateFilename('domains', format);

      spinner = ora('Exporting results...').start();

      const saved = await Exporter.saveToFile(mergedResults, filename, {
        summary: {
          total: mergedResults.length,
          available: grouped.available.length,
          registered: grouped.registered.length,
          unknown: grouped.unknown.length
        }
      });

      spinner.succeed(`Results exported to ${chalk.bold(saved.filename)}\n`);
    }

    // Save cache
    checker.saveCache();

    // Tips
    console.log(chalk.bold.cyan('💡 TIPS:'));
    if (grouped.available.length > 0) {
      console.log(chalk.gray('  • Always verify on a registrar before purchasing'));
      console.log(chalk.gray('  • Check trademark databases'));
      console.log(chalk.gray('  • Consider SEO and brandability'));
    } else {
      console.log(chalk.gray('  • Try lowering --min-score for more options'));
      console.log(chalk.gray('  • Consider alternative TLDs'));
      console.log(chalk.gray('  • Try a different description'));
    }

    console.log();

  } catch (error) {
    if (spinner) spinner.fail('Error occurred');
    console.error(chalk.red(`\n✗ Error: ${error.message}\n`));
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the CLI
main();
