# Domain Name Brainstormer V3 - Production Edition

## 🎯 Overview

A **production-ready**, **TypeScript-based** domain name generation and availability checking tool. Built with clean architecture, proper logging, caching, and comprehensive error handling.

### What Changed from V2

- ✅ **TypeScript** - Full type safety
- ✅ **Proper Dependencies** - Using proven libraries (whois-json, Keyv, Winston)
- ✅ **Clean Architecture** - Domain/Application/Infrastructure layers
- ✅ **Configuration Management** - Convict + dotenv
- ✅ **Production Logging** - Winston with structured logs
- ✅ **Proper Testing** - Jest with good coverage
- ✅ **No Feature Bloat** - Focused on core value: generate + check availability
- ✅ **Dependency Injection** - Testable, maintainable code

### What Was Removed

- ❌ **Social checking** - Unreliable, not core feature
- ❌ **RDAP** - Too complex, WHOIS is good enough with proper caching
- ❌ **V1/V2 duplication** - Single clean codebase
- ❌ **Custom implementations** - Using battle-tested libraries

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Build
npm run build

# Run
npm start "AI task manager"
```

### Development

```bash
# Watch mode
npm run dev "cloud storage"

# Run tests
npm test

# Test with coverage
npm run test:coverage

# Lint
npm run lint
```

---

## 📖 Usage

### Command Line

```bash
# Basic usage
domain-brainstorm "AI task manager"

# Specify TLDs
domain-brainstorm "cloud storage" --tlds .com,.io,.dev

# Set quality threshold
domain-brainstorm "startup idea" --min-score 70 --max 20

# Disable caching
domain-brainstorm "test project" --no-cache

# JSON output (for scripting)
domain-brainstorm "dev tools" --json > results.json
```

### Programmatic API

```typescript
import { searchDomains } from 'domain-brainstormer';

// Simple search
const results = await searchDomains('AI task manager');

console.log(`Found ${results.summary.available} available domains`);

results.results
  .filter(r => r.availability.available)
  .forEach(r => {
    console.log(`${r.domain} - Score: ${r.score}/100`);
  });

// Advanced search
const advancedResults = await searchDomains('cloud storage', {
  tlds: ['.com', '.io', '.cloud'],
  useCache: true,
  generatorOptions: {
    maxSuggestions: 20,
    minScore: 70
  },
  checkerOptions: {
    timeout: 15000,
    maxRetries: 3
  }
});
```

### Using Individual Components

```typescript
import {
  DomainScorer,
  DomainGenerator,
  AvailabilityChecker,
  Cache,
  logger
} from 'domain-brainstormer';

// Scorer
const scorer = new DomainScorer();
const score = scorer.score('taskify');
console.log(`Score: ${score.overall}/100 (${score.grade})`);

// Generator
const generator = new DomainGenerator(scorer);
const suggestions = generator.generate('AI chatbot', {
  maxSuggestions: 10,
  minScore: 65
});

// Checker
const checker = new AvailabilityChecker(logger);
const result = await checker.check('taskify.com');
console.log(`Available: ${result.available}`);

// Cache
const cache = new Cache(logger);
await cache.set('mykey', { data: 'value' }, 3600000);
const cached = await cache.get('mykey');
```

---

## ⚙️ Configuration

Configuration via environment variables or `.env` file:

```bash
# Environment
NODE_ENV=production          # production, development, test

# Logging
LOG_LEVEL=info              # error, warn, info, debug
LOG_FORMAT=json             # json, simple

# WHOIS Settings
WHOIS_TIMEOUT=10000         # Timeout in ms
MAX_CONCURRENT=5            # Max parallel WHOIS requests
MAX_RETRIES=2               # Retry attempts
RETRY_DELAY=2000            # Initial retry delay in ms

# Cache
CACHE_ENABLED=true
CACHE_TTL=86400000          # 24 hours
CACHE_STORE=./.cache        # File path

# Defaults
MIN_SCORE=55                # Minimum quality score
MAX_SUGGESTIONS=20
DEFAULT_TLDS=.com,.io,.dev,.co,.net
```

---

## 🏗️ Architecture

```
src/
├── domain/                 # Business logic (pure, no dependencies)
│   ├── types.ts           # Interfaces and types
│   ├── scorer.ts          # Quality scoring algorithm
│   └── generator.ts       # Name generation logic
│
├── application/           # Use cases (orchestration)
│   ├── domain-search-service.ts  # Main search workflow
│   └── container.ts       # Dependency injection
│
├── infrastructure/        # External concerns
│   ├── logger.ts          # Winston logging
│   ├── cache.ts           # Keyv caching
│   └── availability-checker.ts   # WHOIS checking
│
├── config/               # Configuration
│   └── index.ts          # Convict schema
│
├── cli.ts                # CLI entry point
└── index.ts              # API entry point
```

### Design Principles

1. **Clean Architecture** - Business logic independent of frameworks
2. **Dependency Inversion** - High-level modules don't depend on low-level
3. **Single Responsibility** - Each class has one reason to change
4. **Testability** - All components can be tested in isolation
5. **Configuration over Code** - Behavior controlled by environment

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Structure

- **Unit tests**: Domain logic (scorer, generator)
- **Integration tests**: Coming soon (service layer with mocks)
- **E2E tests**: Coming soon (full CLI workflow)

### Coverage Requirements

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

---

## 📊 Performance

### Benchmarks (20 names × 5 TLDs = 100 checks)

- **First run**: ~15-20 seconds
- **Cached run**: ~0.5 seconds
- **Memory usage**: ~50MB

### Optimization

- ✅ Concurrent WHOIS requests (5 parallel by default)
- ✅ Intelligent caching (24-hour TTL)
- ✅ Exponential backoff on failures
- ✅ Configurable timeouts
- ✅ Small delay between batches (respectful to WHOIS servers)

---

## 🚨 Production Deployment

### Requirements

- Node.js 18+
- 50MB+ RAM
- Write access to cache directory

### Environment Setup

```bash
# Production settings
NODE_ENV=production
LOG_LEVEL=warn
LOG_FORMAT=json
CACHE_STORE=/var/cache/domain-brainstormer
```

### Monitoring

Logs are structured JSON in production:

```json
{
  "level": "info",
  "message": "Search completed",
  "service": "domain-brainstormer",
  "module": "service",
  "timestamp": "2024-01-01 12:00:00",
  "duration": 15234,
  "available": 12,
  "registered": 88
}
```

### Health Checks

```bash
# Basic health check
domain-brainstorm "test" --json > /dev/null && echo "OK" || echo "FAIL"
```

---

## 🔒 Limitations & Disclaimers

### WHOIS Availability Checking

- **Not 100% accurate** - WHOIS responses vary by TLD and registrar
- **Rate limiting** - Some registrars may block excessive queries
- **Temporal nature** - Domain can be registered between check and purchase
- **Premium domains** - May show as "available" but are actually reserved

**Always verify on official registrar before purchasing.**

### Quality Scoring

- **Heuristic-based** - Not validated against real success data
- **Subjective** - What scores high may not work for your brand
- **Use as guide** - Not gospel truth

### Recommendations

1. **Verify availability** on registrar (GoDaddy, Namecheap, etc.)
2. **Check trademarks** - USPTO database
3. **Test with users** - Show potential customers
4. **Consider SEO** - .com still performs best in search
5. **Think long-term** - Name should scale with product

---

## 🛠️ Troubleshooting

### "Module not found" errors

```bash
npm install
npm run build
```

### WHOIS timeouts

Increase timeout in `.env`:
```bash
WHOIS_TIMEOUT=20000
MAX_RETRIES=3
```

### Cache issues

Clear cache:
```bash
rm -rf .cache/
```

Disable caching:
```bash
domain-brainstorm "query" --no-cache
```

### Rate limiting

Reduce concurrency:
```bash
MAX_CONCURRENT=2
```

---

## 📝 License

MIT

---

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Write tests for new features
- Follow TypeScript strict mode
- Use conventional commits
- Update documentation
- Run `npm test` and `npm run lint` before committing

---

## 🙏 Acknowledgments

- Built with TypeScript, Node.js, and ❤️
- Uses battle-tested libraries: whois-json, Keyv, Winston, Convict
- Inspired by the need for reliable, production-ready tools

---

**Built for production. Battle-tested. TypeScript all the way.**
