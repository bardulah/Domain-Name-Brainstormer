/**
 * Enhanced Domain Availability Checker V2
 * Features:
 * - Concurrent checking with worker pool
 * - RDAP support (modern WHOIS alternative)
 * - Caching layer
 * - Retry logic with exponential backoff
 * - Better error handling
 */

const whois = require('whois');
const { promisify } = require('util');
const https = require('https');
const Cache = require('./utils/cache');

const whoisLookup = promisify(whois.lookup);

class AvailabilityCheckerV2 {
  constructor(options = {}) {
    this.cache = new Cache();
    this.maxConcurrent = options.maxConcurrent || 10;
    this.timeout = options.timeout || 8000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 2000;

    // RDAP Bootstrap endpoints for common TLDs
    this.rdapServers = {
      '.com': 'https://rdap.verisign.com/com/v1/domain/',
      '.net': 'https://rdap.verisign.com/net/v1/domain/',
      '.org': 'https://rdap.publicinterestregistry.org/rdap/domain/',
      '.io': 'https://rdap.identitydigital.services/rdap/domain/',
      '.dev': 'https://rdap.google.com/v1/domain/',
      '.app': 'https://rdap.google.com/v1/domain/',
      '.ai': 'https://rdap.identitydigital.services/rdap/domain/',
      '.co': 'https://rdap.identitydigital.services/rdap/domain/',
    };
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Exponential backoff delay
   */
  getBackoffDelay(attempt) {
    return this.retryDelay * Math.pow(2, attempt);
  }

  /**
   * Fetch RDAP data for a domain
   */
  async fetchRDAP(domain) {
    const tld = domain.match(/\.[^.]+$/)?.[0];
    const server = this.rdapServers[tld];

    if (!server) {
      return null; // RDAP not available for this TLD
    }

    return new Promise((resolve, reject) => {
      const url = server + domain;
      const timeout = setTimeout(() => {
        reject(new Error('RDAP timeout'));
      }, this.timeout);

      https.get(url, { timeout: this.timeout }, (res) => {
        clearTimeout(timeout);
        let data = '';

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error('Invalid RDAP response'));
          }
        });
      }).on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Parse RDAP response to determine availability
   */
  parseRDAPResponse(data) {
    // RDAP returns structured data
    // If domain is registered, it has status and events
    if (data.errorCode === 404) {
      return { available: true, method: 'rdap' };
    }

    if (data.status && Array.isArray(data.status)) {
      // Common status values for registered domains
      const registeredStatuses = ['active', 'ok', 'client transfer prohibited'];
      const hasRegisteredStatus = data.status.some(s =>
        registeredStatuses.some(rs => s.toLowerCase().includes(rs.toLowerCase()))
      );

      if (hasRegisteredStatus) {
        return { available: false, method: 'rdap' };
      }
    }

    // If we have events (registration date, etc), it's registered
    if (data.events && data.events.length > 0) {
      return { available: false, method: 'rdap' };
    }

    return { available: null, method: 'rdap' };
  }

  /**
   * Check domain using WHOIS (fallback)
   */
  async checkWithWhois(domain) {
    const result = await whoisLookup(domain);
    const resultLower = result.toLowerCase();

    // Available indicators
    const availableIndicators = [
      'no match',
      'not found',
      'no entries found',
      'no data found',
      'status: available',
      'no match for',
      'not registered',
      'no matching record'
    ];

    // Unavailable indicators
    const unavailableIndicators = [
      'domain name:',
      'registrar:',
      'registered on',
      'creation date',
      'created:',
      'registered date',
      'domain status:'
    ];

    const isAvailable = availableIndicators.some(i => resultLower.includes(i));
    const isUnavailable = unavailableIndicators.some(i => resultLower.includes(i));

    if (isAvailable) {
      return { available: true, method: 'whois' };
    } else if (isUnavailable) {
      return { available: false, method: 'whois' };
    }

    return { available: null, method: 'whois' };
  }

  /**
   * Check single domain with retry logic
   */
  async checkDomainWithRetry(domain, attempt = 0) {
    try {
      // Try RDAP first (faster, more reliable)
      try {
        const rdapData = await this.fetchRDAP(domain);
        if (rdapData !== null) {
          const result = this.parseRDAPResponse(rdapData);
          if (result.available !== null) {
            return result;
          }
        }
      } catch (rdapError) {
        // RDAP failed, will fall back to WHOIS
      }

      // Fallback to WHOIS
      const whoisResult = await Promise.race([
        this.checkWithWhois(domain),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.timeout)
        )
      ]);

      return whoisResult;

    } catch (error) {
      // Retry logic
      if (attempt < this.maxRetries) {
        await this.sleep(this.getBackoffDelay(attempt));
        return this.checkDomainWithRetry(domain, attempt + 1);
      }

      // Max retries exceeded
      return {
        available: null,
        method: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Check single domain (with caching)
   */
  async checkDomain(domain) {
    // Check cache first
    const cached = this.cache.get(domain);
    if (cached) {
      return { domain, ...cached, cached: true };
    }

    // Check availability
    const result = await this.checkDomainWithRetry(domain);

    // Determine status
    let status;
    if (result.available === true) {
      status = 'available';
    } else if (result.available === false) {
      status = 'registered';
    } else if (result.error) {
      status = 'error';
    } else {
      status = 'unknown';
    }

    const domainResult = {
      available: result.available,
      status,
      method: result.method,
      error: result.error,
      cached: false
    };

    // Cache the result (even failures, to avoid repeated lookups)
    this.cache.set(domain, domainResult);

    return { domain, ...domainResult };
  }

  /**
   * Check multiple domains concurrently with worker pool
   */
  async checkAvailability(domainNames, tlds, options = {}) {
    const results = [];
    const progressCallback = options.progressCallback || (() => {});

    // Generate full domain list
    const domains = [];
    for (const name of domainNames) {
      for (const tld of tlds) {
        domains.push(name + tld);
      }
    }

    const total = domains.length;
    let completed = 0;

    // Process in batches (worker pool)
    for (let i = 0; i < domains.length; i += this.maxConcurrent) {
      const batch = domains.slice(i, i + this.maxConcurrent);

      const batchResults = await Promise.all(
        batch.map(domain => this.checkDomain(domain))
      );

      results.push(...batchResults);
      completed += batch.length;

      progressCallback(completed, total);

      // Small delay between batches to be respectful
      if (i + this.maxConcurrent < domains.length) {
        await this.sleep(200);
      }
    }

    return results;
  }

  /**
   * Group results by status
   */
  groupByStatus(results) {
    return {
      available: results.filter(r => r.available === true),
      registered: results.filter(r => r.available === false),
      unknown: results.filter(r => r.available === null)
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Save cache to disk
   */
  saveCache() {
    this.cache.flush();
  }
}

module.exports = AvailabilityCheckerV2;
