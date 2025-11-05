/**
 * Domain Availability Checker
 * Checks if domain names are available for registration
 */

const whois = require('whois');
const { promisify } = require('util');

const whoisLookup = promisify(whois.lookup);

class AvailabilityChecker {
  constructor() {
    // Common TLDs to check
    this.defaultTLDs = ['.com', '.io', '.dev', '.co', '.net', '.org', '.app', '.ai', '.tech', '.xyz'];

    // Rate limiting
    this.requestDelay = 100; // ms between requests to avoid rate limiting
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if a single domain is available
   */
  async checkDomain(domain, timeout = 5000) {
    try {
      const result = await Promise.race([
        whoisLookup(domain),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);

      // Parse WHOIS response to determine availability
      const resultLower = result.toLowerCase();

      // Common indicators that domain is NOT available
      const unavailableIndicators = [
        'domain name:',
        'registrar:',
        'registered on',
        'creation date',
        'created:',
        'registered date'
      ];

      // Common indicators that domain IS available
      const availableIndicators = [
        'no match',
        'not found',
        'no entries found',
        'no data found',
        'status: available',
        'no match for',
        'not registered'
      ];

      // Check for available indicators first
      const isAvailable = availableIndicators.some(indicator =>
        resultLower.includes(indicator)
      );

      // Check for unavailable indicators
      const isUnavailable = unavailableIndicators.some(indicator =>
        resultLower.includes(indicator)
      );

      if (isAvailable) {
        return { domain, available: true, status: 'available' };
      } else if (isUnavailable) {
        return { domain, available: false, status: 'registered' };
      } else {
        // Unable to determine, mark as unknown
        return { domain, available: null, status: 'unknown' };
      }

    } catch (error) {
      // On error, we can't determine availability
      // Could be rate limiting, timeout, or other issues
      if (error.message.includes('Timeout')) {
        return { domain, available: null, status: 'timeout' };
      }
      return { domain, available: null, status: 'error', error: error.message };
    }
  }

  /**
   * Check availability for multiple domains across multiple TLDs
   */
  async checkAvailability(domainNames, tlds = null, options = {}) {
    const tldsToCheck = tlds || this.defaultTLDs;
    const results = [];
    const showProgress = options.showProgress || false;

    let completed = 0;
    const total = domainNames.length * tldsToCheck.length;

    for (const name of domainNames) {
      for (const tld of tldsToCheck) {
        const domain = name + tld;

        if (showProgress && options.progressCallback) {
          options.progressCallback(completed, total);
        }

        const result = await this.checkDomain(domain);
        results.push(result);

        completed++;

        // Rate limiting - wait between requests
        await this.sleep(this.requestDelay);
      }
    }

    return results;
  }

  /**
   * Get only available domains from results
   */
  getAvailable(results) {
    return results.filter(r => r.available === true);
  }

  /**
   * Group results by availability status
   */
  groupByStatus(results) {
    const grouped = {
      available: [],
      registered: [],
      unknown: []
    };

    results.forEach(result => {
      if (result.available === true) {
        grouped.available.push(result);
      } else if (result.available === false) {
        grouped.registered.push(result);
      } else {
        grouped.unknown.push(result);
      }
    });

    return grouped;
  }

  /**
   * Check a limited number of domains (for testing)
   */
  async quickCheck(domainNames, tlds = ['.com', '.io', '.dev'], options = {}) {
    const limitedNames = domainNames.slice(0, 5);
    return this.checkAvailability(limitedNames, tlds, options);
  }
}

module.exports = AvailabilityChecker;
