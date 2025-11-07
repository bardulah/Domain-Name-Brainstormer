/**
 * Domain Search Service
 *
 * Application service that orchestrates the entire domain search workflow:
 * 1. Generate domain suggestions
 * 2. Check availability (with caching)
 * 3. Return comprehensive results
 */

import {
  ILogger,
  IDomainGenerator,
  IAvailabilityChecker,
  ICache,
  SearchOptions,
  SearchResults,
  DomainResult,
  AvailabilityResult
} from '../domain/types';
import config from '../config';

export class DomainSearchService {
  private readonly logger: ILogger;
  private readonly generator: IDomainGenerator;
  private readonly checker: IAvailabilityChecker;
  private readonly cache: ICache;

  constructor(
    logger: ILogger,
    generator: IDomainGenerator,
    checker: IAvailabilityChecker,
    cache: ICache
  ) {
    this.logger = logger;
    this.generator = generator;
    this.checker = checker;
    this.cache = cache;
  }

  /**
   * Search for available domains based on description
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResults> {
    const startTime = Date.now();

    this.logger.info('Starting domain search', { query, options });

    try {
      // Step 1: Generate domain suggestions
      const suggestions = this.generator.generate(query, options.generatorOptions);

      this.logger.info('Generated suggestions', { count: suggestions.length });

      // Step 2: Determine TLDs
      const tlds = options.tlds ?? config.get('tlds');

      // Step 3: Create full domain list (name + TLD combinations)
      const domains: string[] = [];
      for (const suggestion of suggestions) {
        for (const tld of tlds) {
          domains.push(suggestion.name + tld);
        }
      }

      this.logger.info('Checking availability', { domains: domains.length, tlds: tlds.length });

      // Step 4: Check availability (with caching)
      const useCache = options.useCache ?? config.get('cache.enabled');
      const availabilityResults = await this.checkAvailabilityWithCache(domains, useCache);

      // Step 5: Merge suggestions with availability results
      const results: DomainResult[] = availabilityResults.map(avail => {
        const name = avail.domain.substring(0, avail.domain.lastIndexOf('.'));
        const tld = avail.domain.substring(avail.domain.lastIndexOf('.'));
        const suggestion = suggestions.find(s => s.name === name);

        if (!suggestion) {
          throw new Error(`Suggestion not found for domain: ${avail.domain}`);
        }

        return {
          ...suggestion,
          domain: avail.domain,
          tld,
          availability: avail
        };
      });

      // Step 6: Calculate summary
      const duration = Date.now() - startTime;

      const available = results.filter(r => r.availability.available === true).length;
      const registered = results.filter(r => r.availability.available === false).length;
      const unknown = results.filter(r => r.availability.available === null).length;

      const totalScore = suggestions.reduce((sum, s) => sum + s.score, 0);
      const averageScore = suggestions.length > 0 ? Math.round(totalScore / suggestions.length) : 0;

      const searchResults: SearchResults = {
        query,
        suggestions,
        results,
        summary: {
          totalChecked: results.length,
          available,
          registered,
          unknown,
          averageScore,
          duration
        },
        timestamp: new Date()
      };

      this.logger.info('Search completed', {
        duration,
        totalChecked: results.length,
        available,
        registered,
        unknown
      });

      return searchResults;

    } catch (error) {
      this.logger.error('Search failed', {
        query,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Check availability with caching
   */
  private async checkAvailabilityWithCache(
    domains: string[],
    useCache: boolean
  ): Promise<AvailabilityResult[]> {
    const results: AvailabilityResult[] = [];
    const domainsToCheck: string[] = [];

    // Check cache first
    if (useCache) {
      for (const domain of domains) {
        const cached = await this.cache.get<AvailabilityResult>(domain);

        if (cached) {
          // Mark as cached and add to results
          results.push({ ...cached, cached: true });
          this.logger.debug('Cache hit', { domain });
        } else {
          domainsToCheck.push(domain);
        }
      }

      this.logger.info('Cache stats', {
        total: domains.length,
        hits: results.length,
        misses: domainsToCheck.length
      });
    } else {
      domainsToCheck.push(...domains);
    }

    // Check remaining domains
    if (domainsToCheck.length > 0) {
      const checked = await this.checker.checkMultiple(domainsToCheck);

      // Cache the results
      if (useCache) {
        for (const result of checked) {
          await this.cache.set(result.domain, result);
        }
      }

      results.push(...checked);
    }

    // Sort results to match original order
    return domains.map(domain => {
      const result = results.find(r => r.domain === domain);
      if (!result) {
        throw new Error(`Result not found for domain: ${domain}`);
      }
      return result;
    });
  }
}
