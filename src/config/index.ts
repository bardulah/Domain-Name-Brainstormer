/**
 * Production Configuration System
 * Uses convict for schema validation and dotenv for environment variables
 */

import convict from 'convict';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define configuration schema
const config = convict({
  env: {
    doc: 'The application environment',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  logging: {
    level: {
      doc: 'Logging level',
      format: ['error', 'warn', 'info', 'debug'],
      default: 'info',
      env: 'LOG_LEVEL'
    },
    format: {
      doc: 'Log format',
      format: ['json', 'simple'],
      default: 'simple',
      env: 'LOG_FORMAT'
    }
  },
  checker: {
    timeout: {
      doc: 'WHOIS lookup timeout in milliseconds',
      format: 'nat',
      default: 10000,
      env: 'WHOIS_TIMEOUT'
    },
    maxConcurrent: {
      doc: 'Maximum concurrent WHOIS requests',
      format: 'nat',
      default: 5,
      env: 'MAX_CONCURRENT'
    },
    retries: {
      doc: 'Number of retry attempts',
      format: 'nat',
      default: 2,
      env: 'MAX_RETRIES'
    },
    retryDelay: {
      doc: 'Delay between retries in milliseconds',
      format: 'nat',
      default: 2000,
      env: 'RETRY_DELAY'
    }
  },
  cache: {
    enabled: {
      doc: 'Enable caching',
      format: Boolean,
      default: true,
      env: 'CACHE_ENABLED'
    },
    ttl: {
      doc: 'Cache TTL in milliseconds (24 hours default)',
      format: 'nat',
      default: 24 * 60 * 60 * 1000,
      env: 'CACHE_TTL'
    },
    namespace: {
      doc: 'Cache namespace/prefix',
      format: String,
      default: 'domain-brainstormer',
      env: 'CACHE_NAMESPACE'
    },
    store: {
      doc: 'Cache store path',
      format: String,
      default: './.cache',
      env: 'CACHE_STORE'
    }
  },
  generator: {
    minScore: {
      doc: 'Minimum quality score (0-100)',
      format: (val: number) => {
        if (val < 0 || val > 100) throw new Error('Must be between 0-100');
      },
      default: 55,
      env: 'MIN_SCORE'
    },
    maxSuggestions: {
      doc: 'Maximum domain suggestions',
      format: 'nat',
      default: 20,
      env: 'MAX_SUGGESTIONS'
    }
  },
  tlds: {
    doc: 'Default TLDs to check',
    format: Array,
    default: ['.com', '.io', '.dev', '.co', '.net', '.app', '.ai'],
    env: 'DEFAULT_TLDS'
  }
});

// Validate configuration
config.validate({ allowed: 'strict' });

export default config;
export type Config = ReturnType<typeof config.getProperties>;
