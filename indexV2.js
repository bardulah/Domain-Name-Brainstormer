/**
 * Domain Name Brainstormer V2
 * Enhanced Edition - Main Module
 */

const DomainGeneratorV2 = require('./domainGeneratorV2');
const AvailabilityCheckerV2 = require('./availabilityCheckerV2');
const SocialChecker = require('./utils/socialChecker');
const DomainScorer = require('./utils/domainScorer');
const PronounceabilityScorer = require('./utils/pronounceability');
const Exporter = require('./utils/exporter');
const Cache = require('./utils/cache');

// Legacy compatibility
const DomainGenerator = require('./domainGenerator');
const AvailabilityChecker = require('./availabilityChecker');

/**
 * Enhanced brainstorming function with all features
 */
async function brainstormDomainsV2(description, options = {}) {
  const generator = new DomainGeneratorV2();
  const checker = new AvailabilityCheckerV2({
    maxConcurrent: options.maxConcurrent || 10,
    timeout: options.timeout || 8000
  });

  // Generate suggestions
  const suggestions = generator.generate(description, {
    maxSuggestions: options.maxSuggestions || 20,
    minScore: options.minScore || 55
  });

  // Determine TLDs
  const tlds = options.tlds || ['.com', '.io', '.dev', '.co', '.net', '.app', '.ai'];

  // Check availability
  const names = suggestions.map(s => s.name);
  const availabilityResults = await checker.checkAvailability(names, tlds, {
    showProgress: options.showProgress || false,
    progressCallback: options.progressCallback
  });

  // Merge results
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

  // Check social handles if requested
  if (options.checkSocial) {
    const socialChecker = new SocialChecker();
    const availableDomains = mergedResults.filter(r => r.available === true);
    const uniqueNames = [...new Set(availableDomains.map(r => r.name))];

    const socialPlatforms = options.socialPlatforms || ['github', 'instagram'];
    const socialResults = await socialChecker.checkMultipleHandles(
      uniqueNames.slice(0, 20),
      socialPlatforms
    );

    for (const result of mergedResults) {
      if (socialResults.has(result.name)) {
        result.social = socialResults.get(result.name);
      }
    }
  }

  // Group results
  const grouped = checker.groupByStatus(mergedResults);

  // Save cache
  checker.saveCache();

  return {
    suggestions,
    results: mergedResults,
    available: grouped.available,
    registered: grouped.registered,
    unknown: grouped.unknown,
    summary: {
      total: mergedResults.length,
      available: grouped.available.length,
      registered: grouped.registered.length,
      unknown: grouped.unknown.length,
      avgScore: suggestions.length > 0 ?
        Math.round(suggestions.reduce((sum, s) => sum + s.score, 0) / suggestions.length) :
        0
    }
  };
}

/**
 * Quick brainstorm with defaults
 */
async function quickBrainstormV2(description, options = {}) {
  return brainstormDomainsV2(description, {
    maxSuggestions: 10,
    minScore: 60,
    tlds: ['.com', '.io', '.dev'],
    maxConcurrent: 5,
    ...options
  });
}

/**
 * Generate domain names only (no availability check)
 */
function generateDomainNames(description, options = {}) {
  const generator = new DomainGeneratorV2();
  return generator.generate(description, options);
}

/**
 * Score a domain name
 */
function scoreDomain(name) {
  const scorer = new DomainScorer();
  return scorer.score(name);
}

/**
 * Check pronounceability of a name
 */
function checkPronounceability(name) {
  const scorer = new PronounceabilityScorer();
  return {
    score: scorer.score(name),
    isPronounceable: scorer.isPronounceable(name)
  };
}

/**
 * Check availability of specific domains
 */
async function checkAvailability(domains, options = {}) {
  const checker = new AvailabilityCheckerV2(options);
  const results = [];

  for (const domain of domains) {
    const result = await checker.checkDomain(domain);
    results.push(result);
  }

  checker.saveCache();
  return results;
}

/**
 * Check social handle availability
 */
async function checkSocialHandles(handle, platforms = ['github', 'twitter', 'instagram']) {
  const checker = new SocialChecker();
  return checker.checkHandle(handle, platforms);
}

/**
 * Export results
 */
function exportResults(results, filename, options = {}) {
  return Exporter.saveToFile(results, filename, options);
}

// Export everything
module.exports = {
  // V2 Enhanced API
  brainstormDomainsV2,
  quickBrainstormV2,
  generateDomainNames,
  scoreDomain,
  checkPronounceability,
  checkAvailability,
  checkSocialHandles,
  exportResults,

  // Classes
  DomainGeneratorV2,
  AvailabilityCheckerV2,
  SocialChecker,
  DomainScorer,
  PronounceabilityScorer,
  Exporter,
  Cache,

  // Legacy compatibility
  DomainGenerator,
  AvailabilityChecker,
  brainstormDomains: brainstormDomainsV2,
  quickBrainstorm: quickBrainstormV2
};
