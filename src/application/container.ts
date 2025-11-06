/**
 * Dependency Injection Container
 *
 * Creates and wires up all dependencies
 * Makes testing easier and provides a single source of truth
 */

import { DomainScorer } from '../domain/scorer';
import { DomainGenerator } from '../domain/generator';
import { AvailabilityChecker } from '../infrastructure/availability-checker';
import { Cache } from '../infrastructure/cache';
import { DomainSearchService } from './domain-search-service';
import logger, { createModuleLogger } from '../infrastructure/logger';

/**
 * Application container with all dependencies
 */
export interface Container {
  searchService: DomainSearchService;
}

/**
 * Create production container
 */
export function createContainer(): Container {
  // Create module-specific loggers
  const checkerLogger = createModuleLogger('checker');
  const cacheLogger = createModuleLogger('cache');
  const serviceLogger = createModuleLogger('service');

  // Create domain objects
  const scorer = new DomainScorer();
  const generator = new DomainGenerator(scorer);

  // Create infrastructure objects
  const checker = new AvailabilityChecker(checkerLogger);
  const cache = new Cache(cacheLogger);

  // Create application service
  const searchService = new DomainSearchService(
    serviceLogger,
    generator,
    checker,
    cache
  );

  return {
    searchService
  };
}

/**
 * Global container instance (singleton)
 */
let containerInstance: Container | null = null;

/**
 * Get or create container
 */
export function getContainer(): Container {
  if (!containerInstance) {
    containerInstance = createContainer();
    logger.info('Application container initialized');
  }
  return containerInstance;
}
