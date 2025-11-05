#!/usr/bin/env node

/**
 * Domain Name Brainstormer CLI
 */

const { brainstormDomains, quickBrainstorm } = require('./index');
const chalk = require('chalk');
const ora = require('ora');

// Parse command line arguments
const args = process.argv.slice(2);

// Help text
const HELP_TEXT = `
${chalk.bold('Domain Name Brainstormer')}

${chalk.bold('USAGE:')}
  domain-brainstorm <description> [options]
  node cli.js <description> [options]

${chalk.bold('DESCRIPTION:')}
  Generate creative domain name suggestions and check their availability
  across multiple TLDs (.com, .io, .dev, .co, etc.)

${chalk.bold('OPTIONS:')}
  --quick, -q          Quick mode (fewer suggestions, faster)
  --max <n>           Maximum number of domain suggestions (default: 20)
  --tlds <list>       Comma-separated list of TLDs (e.g., ".com,.io,.dev")
  --help, -h          Show this help message

${chalk.bold('EXAMPLES:')}
  domain-brainstorm "real-time chat application"
  node cli.js "AI-powered task manager" --quick
  node cli.js "social network for developers" --max 15 --tlds ".com,.dev,.io"

${chalk.bold('TLD OPTIONS:')}
  Common TLDs: .com, .io, .dev, .co, .net, .org, .app, .ai, .tech, .xyz
`;

// Show help
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(HELP_TEXT);
  process.exit(0);
}

// Parse options
const options = {
  quick: args.includes('--quick') || args.includes('-q'),
  maxSuggestions: 20,
  tlds: null
};

// Parse --max option
const maxIndex = args.findIndex(arg => arg === '--max');
if (maxIndex !== -1 && args[maxIndex + 1]) {
  options.maxSuggestions = parseInt(args[maxIndex + 1]);
}

// Parse --tlds option
const tldsIndex = args.findIndex(arg => arg === '--tlds');
if (tldsIndex !== -1 && args[tldsIndex + 1]) {
  options.tlds = args[tldsIndex + 1].split(',').map(tld => {
    return tld.startsWith('.') ? tld : '.' + tld;
  });
}

// Get description (everything that's not an option)
const description = args
  .filter(arg => !arg.startsWith('--') && !arg.startsWith('-'))
  .filter((arg, i, arr) => {
    // Exclude values that follow option flags
    const prevArg = arr[i - 1] || args[args.indexOf(arg) - 1];
    return prevArg !== '--max' && prevArg !== '--tlds';
  })
  .join(' ')
  .trim();

if (!description) {
  console.log(chalk.red('Error: Please provide a project description'));
  console.log('Run with --help for usage information');
  process.exit(1);
}

// Main function
async function main() {
  console.log(chalk.bold.cyan('\n🚀 Domain Name Brainstormer\n'));
  console.log(chalk.gray(`Project: ${description}`));
  console.log(chalk.gray(`Mode: ${options.quick ? 'Quick' : 'Standard'}\n`));

  const spinner = ora('Generating domain suggestions...').start();

  try {
    // Track progress
    let currentProgress = 0;
    let totalChecks = 0;

    options.progressCallback = (completed, total) => {
      totalChecks = total;
      currentProgress = completed;
      const percentage = Math.round((completed / total) * 100);
      spinner.text = `Checking availability... ${percentage}% (${completed}/${total})`;
    };

    // Generate and check domains
    const brainstormFunc = options.quick ? quickBrainstorm : brainstormDomains;
    const results = await brainstormFunc(description, options);

    spinner.succeed('Domain check complete!\n');

    // Display results
    console.log(chalk.bold('📊 SUMMARY:'));
    console.log(chalk.gray(`  Total checked: ${results.summary.total}`));
    console.log(chalk.green(`  Available: ${results.summary.available}`));
    console.log(chalk.red(`  Registered: ${results.summary.registered}`));
    console.log(chalk.yellow(`  Unknown: ${results.summary.unknown}\n`));

    // Show available domains
    if (results.available.length > 0) {
      console.log(chalk.bold.green('✅ AVAILABLE DOMAINS:\n'));
      results.available.forEach(result => {
        console.log(chalk.green(`  ✓ ${result.domain}`));
      });
      console.log();
    } else {
      console.log(chalk.yellow('⚠️  No available domains found.\n'));
    }

    // Show some registered domains (limited to first 10)
    if (results.registered.length > 0) {
      console.log(chalk.bold.red('❌ REGISTERED DOMAINS (sample):\n'));
      results.registered.slice(0, 10).forEach(result => {
        console.log(chalk.red(`  ✗ ${result.domain}`));
      });
      if (results.registered.length > 10) {
        console.log(chalk.gray(`  ... and ${results.registered.length - 10} more`));
      }
      console.log();
    }

    // Show unknown status domains if any
    if (results.unknown.length > 0) {
      console.log(chalk.bold.yellow('❓ COULD NOT VERIFY:\n'));
      results.unknown.slice(0, 5).forEach(result => {
        console.log(chalk.yellow(`  ? ${result.domain} (${result.status})`));
      });
      if (results.unknown.length > 5) {
        console.log(chalk.gray(`  ... and ${results.unknown.length - 5} more`));
      }
      console.log();
    }

    // Tips
    if (results.available.length > 0) {
      console.log(chalk.bold.cyan('💡 TIPS:'));
      console.log(chalk.gray('  • Verify availability on a domain registrar before purchasing'));
      console.log(chalk.gray('  • Consider trademark implications'));
      console.log(chalk.gray('  • Shorter domains are generally better\n'));
    } else {
      console.log(chalk.bold.cyan('💡 TIPS:'));
      console.log(chalk.gray('  • Try running again with --quick for different suggestions'));
      console.log(chalk.gray('  • Consider alternative TLDs with --tlds'));
      console.log(chalk.gray('  • Try a different project description\n'));
    }

  } catch (error) {
    spinner.fail('Error occurred');
    console.error(chalk.red(`\nError: ${error.message}`));
    process.exit(1);
  }
}

// Run the CLI
main();
