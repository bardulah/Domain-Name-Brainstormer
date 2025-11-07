/**
 * Main API Entry Point
 *
 * Exports public API for programmatic usage
 */

// Export types
export * from './domain/types';

// Export domain classes
export { DomainScorer } from './domain/scorer';
export { DomainGenerator } from './domain/generator';

// Export infrastructure
export { AvailabilityChecker } from './infrastructure/availability-checker';
export { Cache } from './infrastructure/cache';

// Export application service
export { DomainSearchService } from './application/domain-search-service';
export { getContainer, createContainer } from './application/container';

// Export config and logger for advanced usage
export { default as config } from './config';
export { default as logger, createModuleLogger } from './infrastructure/logger';

/**
 * Convenience function for quick domain search
 *
 * @example
 * ```typescript
 * import { searchDomains } from 'domain-brainstormer';
 *
 * const results = await searchDomains('AI task manager', {
 *   tlds: ['.com', '.io'],
 *   generatorOptions: {
 *     maxSuggestions: 10,
 *     minScore: 70
 *   }
 * });
 *
 * console.log(`Found ${results.summary.available} available domains`);
 * ```
 */
export async function searchDomains(
  description: string,
  options?: import('./domain/types').SearchOptions
): Promise<import('./domain/types').SearchResults> {
  const { getContainer: getContainerFn } = await import('./application/container');
  const container = getContainerFn();
  return container.searchService.search(description, options);
}
