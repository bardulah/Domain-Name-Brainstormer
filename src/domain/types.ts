/**
 * Domain Types and Interfaces
 * Core business entities and value objects
 */

/**
 * Quality score breakdown by category
 */
export interface ScoreBreakdown {
  pronounceability: number;
  length: number;
  brandability: number;
  memorability: number;
  typingEase: number;
}

/**
 * Overall scoring result
 */
export interface ScoringResult {
  overall: number; // 0-100
  grade: Grade;
  breakdown: ScoreBreakdown;
}

/**
 * Quality grades
 */
export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

/**
 * Domain name suggestion with scoring
 */
export interface DomainSuggestion {
  name: string;
  score: number;
  scoring: ScoringResult;
}

/**
 * Domain availability status
 */
export type AvailabilityStatus = 'available' | 'registered' | 'unknown' | 'error';

/**
 * Domain availability check result
 */
export interface AvailabilityResult {
  domain: string;
  available: boolean | null;
  status: AvailabilityStatus;
  checkedAt: Date;
  cached: boolean;
  error?: string;
}

/**
 * Complete domain result (suggestion + availability)
 */
export interface DomainResult extends DomainSuggestion {
  domain: string; // name + TLD
  tld: string;
  availability: AvailabilityResult;
}

/**
 * Search summary statistics
 */
export interface SearchSummary {
  totalChecked: number;
  available: number;
  registered: number;
  unknown: number;
  averageScore: number;
  duration: number; // milliseconds
}

/**
 * Complete search results
 */
export interface SearchResults {
  query: string;
  suggestions: DomainSuggestion[];
  results: DomainResult[];
  summary: SearchSummary;
  timestamp: Date;
}

/**
 * Generator options
 */
export interface GeneratorOptions {
  maxSuggestions?: number;
  minScore?: number;
}

/**
 * Checker options
 */
export interface CheckerOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Search options
 */
export interface SearchOptions {
  tlds?: string[];
  maxConcurrent?: number;
  generatorOptions?: GeneratorOptions;
  checkerOptions?: CheckerOptions;
  useCache?: boolean;
}

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  data: T;
  cachedAt: Date;
  expiresAt: Date;
}

/**
 * Logger interface
 */
export interface ILogger {
  error(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  debug(message: string, meta?: unknown): void;
}

/**
 * Domain scorer interface
 */
export interface IDomainScorer {
  score(name: string): ScoringResult;
}

/**
 * Domain generator interface
 */
export interface IDomainGenerator {
  generate(description: string, options?: GeneratorOptions): DomainSuggestion[];
}

/**
 * Availability checker interface
 */
export interface IAvailabilityChecker {
  check(domain: string): Promise<AvailabilityResult>;
  checkMultiple(domains: string[]): Promise<AvailabilityResult[]>;
}

/**
 * Cache interface
 */
export interface ICache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}
