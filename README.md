# Domain Name Brainstormer

A powerful CLI tool that suggests creative domain names across multiple TLDs (.com, .io, .dev, .co, etc.) based on project descriptions, then verifies which domains are actually available for registration. Say goodbye to manual domain hunting!

## Features

- **Smart Name Generation**: Uses multiple strategies to create creative domain suggestions:
  - Keyword extraction from project descriptions
  - Intelligent word combinations
  - Portmanteau creation (word blending)
  - Creative spelling variations
  - Acronym generation
  - Prefix/suffix additions
  - Tech term combinations

- **Multi-TLD Support**: Checks availability across popular TLDs:
  - .com, .io, .dev, .co, .net, .org
  - .app, .ai, .tech, .xyz
  - Custom TLD selection

- **Real-time Availability**: Uses WHOIS lookups to verify actual domain availability

- **Beautiful CLI Output**: Color-coded results with progress indicators

- **Flexible Modes**: Quick mode for rapid results, or standard mode for comprehensive suggestions

## Installation

### Option 1: Install dependencies (for local usage)

```bash
npm install
```

### Option 2: Global installation (for command-line use anywhere)

```bash
npm install -g .
```

## Usage

### Command Line Interface

#### Basic usage:
```bash
node cli.js "your project description"
```

#### Quick mode (faster, fewer suggestions):
```bash
node cli.js "AI-powered task manager" --quick
```

#### Custom options:
```bash
node cli.js "social network for developers" --max 15 --tlds ".com,.dev,.io"
```

#### If installed globally:
```bash
domain-brainstorm "real-time chat application"
```

### CLI Options

| Option | Description | Example |
|--------|-------------|---------|
| `--quick`, `-q` | Quick mode (10 suggestions, 3 TLDs) | `--quick` |
| `--max <n>` | Maximum number of suggestions | `--max 25` |
| `--tlds <list>` | Comma-separated TLD list | `--tlds ".com,.io,.dev"` |
| `--help`, `-h` | Show help message | `--help` |

### Examples

```bash
# E-commerce project
node cli.js "online marketplace for handmade crafts"

# Developer tool
node cli.js "code review automation tool" --quick

# Mobile app
node cli.js "fitness tracking mobile app" --max 30 --tlds ".app,.io,.fit"

# Startup idea
node cli.js "B2B SaaS platform for project management"
```

## Programmatic Usage

You can also use the tool as a Node.js module:

```javascript
const { brainstormDomains, quickBrainstorm } = require('./index');

// Standard brainstorming
async function findDomain() {
  const results = await brainstormDomains('AI-powered chatbot', {
    maxSuggestions: 20,
    tlds: ['.com', '.ai', '.io']
  });

  console.log(`Found ${results.available.length} available domains:`);
  results.available.forEach(domain => {
    console.log(`  - ${domain.domain}`);
  });
}

// Quick brainstorming
async function quickFind() {
  const results = await quickBrainstorm('mobile game');
  console.log(results.summary);
}

findDomain();
```

### Using Individual Components

```javascript
const DomainGenerator = require('./domainGenerator');
const AvailabilityChecker = require('./availabilityChecker');

// Generate suggestions only
const generator = new DomainGenerator();
const suggestions = generator.generate('cloud storage app', {
  maxSuggestions: 30
});

console.log('Suggestions:', suggestions);

// Check availability manually
const checker = new AvailabilityChecker();
const results = await checker.checkAvailability(
  ['cloudstore', 'storehub'],
  ['.com', '.io', '.cloud']
);

console.log('Available:', checker.getAvailable(results));
```

## How It Works

### 1. Keyword Extraction
The tool analyzes your project description and extracts meaningful keywords, filtering out common stop words.

### 2. Name Generation Strategies

- **Direct Keywords**: Uses extracted keywords as-is
- **Word Combinations**: Combines 2-3 keywords intelligently
- **Portmanteau**: Blends words together (e.g., "social" + "network" = "socnet")
- **Prefixes/Suffixes**: Adds common terms like "get", "app", "hub", "kit"
- **Tech Terms**: Combines keywords with tech-related words
- **Acronyms**: Creates pronounceable acronyms from keywords
- **Creative Spelling**: Applies variations like "er" → "r", "oo" → "u"

### 3. Availability Checking
For each generated name, the tool:
1. Checks the domain across multiple TLDs using WHOIS
2. Parses WHOIS responses to determine availability
3. Categorizes results as: available, registered, or unknown
4. Implements rate limiting to respect WHOIS servers

### 4. Result Presentation
Displays color-coded results:
- Green ✓ for available domains
- Red ✗ for registered domains
- Yellow ? for uncertain status

## Testing

Run the test suite to see the generator in action without WHOIS lookups:

```bash
npm test
# or
node test.js
```

This demonstrates:
- Domain name generation
- Keyword extraction
- Portmanteau creation
- Creative spelling variations
- Full generation pipeline

## Output Example

```
🚀 Domain Name Brainstormer

Project: AI-powered task manager
Mode: Quick

✔ Domain check complete!

📊 SUMMARY:
  Total checked: 30
  Available: 8
  Registered: 20
  Unknown: 2

✅ AVAILABLE DOMAINS:

  ✓ aitask.dev
  ✓ taskmanager.app
  ✓ smarttask.io
  ✓ taskai.dev
  ✓ aitaskr.com
  ✓ gotask.dev
  ✓ taskify.io
  ✓ taskhub.app

❌ REGISTERED DOMAINS (sample):

  ✗ taskmanager.com
  ✗ aitask.com
  ✗ taskapp.com
  ...

💡 TIPS:
  • Verify availability on a domain registrar before purchasing
  • Consider trademark implications
  • Shorter domains are generally better
```

## Performance Notes

- **Quick mode**: ~10 seconds (10 names × 3 TLDs = 30 checks)
- **Standard mode**: ~2-3 minutes (20 names × 7 TLDs = 140 checks)
- WHOIS lookups are rate-limited to avoid server restrictions
- Some TLDs may timeout or return uncertain results

## Limitations

- WHOIS availability is indicative but not guaranteed - always verify on a registrar
- Some domain registrars may restrict WHOIS queries
- Rate limiting may cause slower checks for large batches
- Premium/reserved domains may show as "available" but aren't actually for sale
- Some TLDs have restricted access or special requirements

## Recommendations

1. **Always verify** domain availability on an official registrar before purchasing
2. **Check trademarks** to avoid legal issues
3. **Consider SEO**: .com domains often perform better in search results
4. **Think long-term**: Choose a name that scales with your project
5. **Test pronunciation**: Make sure the domain is easy to say and remember
6. **Avoid hyphens and numbers**: They're harder to communicate verbally

## Technical Details

### Dependencies

- **whois**: WHOIS lookup functionality
- **chalk**: Terminal colors and styling
- **ora**: Elegant loading spinners

### File Structure

```
Domain-Name-Brainstormer/
├── cli.js                 # CLI interface
├── index.js               # Main module exports
├── domainGenerator.js     # Name generation logic
├── availabilityChecker.js # WHOIS availability checking
├── test.js                # Test suite
├── package.json           # Project metadata
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

### API Reference

#### `brainstormDomains(description, options)`

Main function to generate and check domains.

**Parameters:**
- `description` (string): Project description
- `options` (object):
  - `maxSuggestions` (number): Max suggestions to generate (default: 20)
  - `tlds` (array): TLDs to check (default: ['.com', '.io', '.dev', '.co', '.net', '.app', '.ai'])
  - `showProgress` (boolean): Show progress updates
  - `progressCallback` (function): Custom progress handler

**Returns:** Object with `suggestions`, `results`, `available`, `registered`, `unknown`, `summary`

#### `quickBrainstorm(description, options)`

Quick mode with fewer suggestions and TLDs.

**Parameters:** Same as `brainstormDomains`

**Returns:** Same structure as `brainstormDomains`

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Improve name generation strategies
- Add support for more TLDs
- Enhance documentation

## License

MIT

## Author

Created with Claude Code

## Troubleshooting

### "No available domains found"
- Try different project descriptions with more varied keywords
- Use `--quick` for different suggestions
- Try alternative TLDs with `--tlds`
- Consider longer or more creative descriptions

### "Unknown" status for domains
- Some WHOIS servers may timeout or be unavailable
- Try checking those domains manually on a registrar
- Network issues can cause uncertain results

### Slow performance
- Use `--quick` mode for faster results
- Reduce `--max` suggestions
- Limit TLDs with `--tlds` to fewer options

---

Happy domain hunting! 🚀
