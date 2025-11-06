/**
 * Availability Checker - Production Implementation
 *
 * Uses whois-json library for reliable WHOIS lookups
 * Implements retry logic and proper error handling
 */

import whoisJson from 'whois-json';
import { AvailabilityResult, CheckerOptions, IAvailabilityChecker, ILogger } from '../domain/types';
import config from '../config';

export class AvailabilityChecker implements IAvailabilityChecker {
  private readonly logger: ILogger;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(logger: ILogger, options: CheckerOptions = {}) {
    this.logger = logger;
    this.timeout = options.timeout ?? config.get('checker.timeout');
    this.maxRetries = options.maxRetries ?? config.get('checker.retries');
    this.retryDelay = options.retryDelay ?? config.get('checker.retryDelay');
  }

  /**
   * Check single domain availability
   */
  async check(domain: string): Promise<AvailabilityResult> {
    this.logger.debug('Checking domain', { domain });

    return this.checkWithRetry(domain, 0);
  }

  /**
   * Check multiple domains with concurrency control
   */
  async checkMultiple(domains: string[]): Promise<AvailabilityResult[]> {
    const maxConcurrent = config.get('checker.maxConcurrent');
    const results: AvailabilityResult[] = [];

    this.logger.info('Checking multiple domains', {
      count: domains.length,
      maxConcurrent
    });

    // Process in batches
    for (let i = 0; i < domains.length; i += maxConcurrent) {
      const batch = domains.slice(i, i + maxConcurrent);

      const batchResults = await Promise.allSettled(
        batch.map(domain => this.check(domain))
      );

      // Extract results from settled promises
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // If check fails completely, return error result
          results.push({
            domain: batch[index],
            available: null,
            status: 'error',
            checkedAt: new Date(),
            cached: false,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      // Small delay between batches to be respectful to WHOIS servers
      if (i + maxConcurrent < domains.length) {
        await this.sleep(500);
      }
    }

    return results;
  }

  /**
   * Check with retry logic
   */
  private async checkWithRetry(domain: string, attempt: number): Promise<AvailabilityResult> {
    try {
      const result = await this.performWhoisLookup(domain);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.warn('WHOIS lookup failed', {
        domain,
        attempt: attempt + 1,
        maxRetries: this.maxRetries,
        error: errorMessage
      });

      // Retry if attempts remaining
      if (attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
        await this.sleep(delay);
        return this.checkWithRetry(domain, attempt + 1);
      }

      // Max retries exceeded
      return {
        domain,
        available: null,
        status: 'error',
        checkedAt: new Date(),
        cached: false,
        error: errorMessage
      };
    }
  }

  /**
   * Perform WHOIS lookup and parse result
   */
  private async performWhoisLookup(domain: string): Promise<AvailabilityResult> {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('WHOIS timeout')), this.timeout);
    });

    // Race between WHOIS lookup and timeout
    const whoisResult = await Promise.race([
      whoisJson(domain),
      timeoutPromise
    ]);

    // Parse WHOIS response
    const available = this.parseWhoisResponse(whoisResult, domain);

    return {
      domain,
      available,
      status: available === true ? 'available' :
              available === false ? 'registered' : 'unknown',
      checkedAt: new Date(),
      cached: false
    };
  }

  /**
   * Parse WHOIS response to determine availability
   *
   * IMPORTANT: WHOIS responses vary by TLD and registrar.
   * This parsing is best-effort and may not be 100% accurate.
   */
  private parseWhoisResponse(result: unknown, domain: string): boolean | null {
    try {
      // Convert to string for text analysis
      const resultStr = JSON.stringify(result).toLowerCase();

      // Common indicators of availability
      const availableIndicators = [
        'no match',
        'not found',
        'no entries found',
        'no data found',
        'status: available',
        'no matching record',
        'not registered',
        'available for registration'
      ];

      // Check if domain is available
      const isAvailable = availableIndicators.some(indicator =>
        resultStr.includes(indicator)
      );

      if (isAvailable) {
        this.logger.debug('Domain appears available', { domain });
        return true;
      }

      // Check for registration indicators (more reliable)
      if (typeof result === 'object' && result !== null) {
        const data = result as Record<string, unknown>;

        // If we have registrar info, it's definitely registered
        if (data.registrar || data.registrarName || data['Registrar']) {
          this.logger.debug('Domain is registered (has registrar)', { domain });
          return false;
        }

        // If we have creation/expiration dates, it's registered
        if (data.creationDate || data.expirationDate || data['Creation Date']) {
          this.logger.debug('Domain is registered (has dates)', { domain });
          return false;
        }
      }

      // If we can't determine, return null (unknown)
      this.logger.debug('Domain status unknown', { domain });
      return null;

    } catch (error) {
      this.logger.error('Error parsing WHOIS response', {
        domain,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
