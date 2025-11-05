/**
 * Domain Name Brainstormer
 * Main module
 */

const DomainGenerator = require('./domainGenerator');
const AvailabilityChecker = require('./availabilityChecker');

/**
 * Main function to brainstorm and check domain availability
 */
async function brainstormDomains(description, options = {}) {
  const generator = new DomainGenerator();
  const checker = new AvailabilityChecker();

  // Generate domain name suggestions
  const suggestions = generator.generate(description, {
    maxSuggestions: options.maxSuggestions || 20
  });

  // Determine which TLDs to check
  const tlds = options.tlds || ['.com', '.io', '.dev', '.co', '.net', '.app', '.ai'];

  // Check availability
  const results = await checker.checkAvailability(suggestions, tlds, {
    showProgress: options.showProgress || false,
    progressCallback: options.progressCallback
  });

  // Group results by status
  const grouped = checker.groupByStatus(results);

  return {
    suggestions,
    results,
    available: grouped.available,
    registered: grouped.registered,
    unknown: grouped.unknown,
    summary: {
      total: results.length,
      available: grouped.available.length,
      registered: grouped.registered.length,
      unknown: grouped.unknown.length
    }
  };
}

/**
 * Quick check - generates fewer suggestions and checks fewer TLDs
 */
async function quickBrainstorm(description, options = {}) {
  return brainstormDomains(description, {
    maxSuggestions: options.maxSuggestions || 10,
    tlds: options.tlds || ['.com', '.io', '.dev'],
    ...options
  });
}

module.exports = {
  DomainGenerator,
  AvailabilityChecker,
  brainstormDomains,
  quickBrainstorm
};
