/**
 * Domain Name Generator
 *
 * Generates domain name suggestions using proven strategies:
 * 1. Extract keywords from description
 * 2. Apply various combination strategies
 * 3. Score and filter by quality
 * 4. Return ranked suggestions
 */

import { DomainSuggestion, GeneratorOptions, IDomainGenerator, IDomainScorer } from './types';

export class DomainGenerator implements IDomainGenerator {
  private readonly scorer: IDomainScorer;

  // Common brand-friendly elements
  private readonly prefixes = ['get', 'try', 'use', 'my', 'go', 'hey', 'do', 'app'];
  private readonly suffixes = ['ify', 'ly', 'app', 'hub', 'kit', 'box', 'base', 'flow', 'space'];
  private readonly techTerms = ['cloud', 'code', 'dev', 'data', 'web', 'smart', 'quick', 'auto'];

  // Stop words to filter out
  private readonly stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'is', 'are', 'was', 'were', 'be', 'have', 'has'
  ]);

  constructor(scorer: IDomainScorer) {
    this.scorer = scorer;
  }

  /**
   * Generate domain suggestions from description
   */
  generate(description: string, options: GeneratorOptions = {}): DomainSuggestion[] {
    const maxSuggestions = options.maxSuggestions ?? 20;
    const minScore = options.minScore ?? 55;

    // Extract keywords
    const keywords = this.extractKeywords(description);

    if (keywords.length === 0) {
      throw new Error('Could not extract meaningful keywords from description');
    }

    // Generate candidates using multiple strategies
    const candidates = new Set<string>();

    // Strategy 1: Use keywords directly
    keywords.forEach(kw => {
      if (kw.length >= 4 && kw.length <= 12) {
        candidates.add(kw);
      }
    });

    // Strategy 2: Add prefixes/suffixes
    keywords.slice(0, 5).forEach(kw => {
      this.prefixes.forEach(prefix => {
        const name = prefix + kw;
        if (name.length <= 14) candidates.add(name);
      });

      this.suffixes.forEach(suffix => {
        const name = kw + suffix;
        if (name.length <= 14) candidates.add(name);
      });
    });

    // Strategy 3: Combine keywords
    for (let i = 0; i < Math.min(keywords.length, 3); i++) {
      for (let j = i + 1; j < Math.min(keywords.length, 4); j++) {
        const combo1 = keywords[i] + keywords[j];
        const combo2 = keywords[j] + keywords[i];

        if (combo1.length <= 14) candidates.add(combo1);
        if (combo2.length <= 14) candidates.add(combo2);
      }
    }

    // Strategy 4: Combine with tech terms
    keywords.slice(0, 3).forEach(kw => {
      this.techTerms.slice(0, 3).forEach(term => {
        const combo1 = kw + term;
        const combo2 = term + kw;

        if (combo1.length <= 14) candidates.add(combo1);
        if (combo2.length <= 14) candidates.add(combo2);
      });
    });

    // Score, filter, and sort
    const suggestions = Array.from(candidates)
      .filter(name => this.isValidDomainName(name))
      .map(name => {
        const scoring = this.scorer.score(name);
        return {
          name,
          score: scoring.overall,
          scoring
        };
      })
      .filter(s => s.score >= minScore)
      .sort((a, b) => {
        // Sort by score desc, then by length asc
        if (b.score !== a.score) return b.score - a.score;
        return a.name.length - b.name.length;
      })
      .slice(0, maxSuggestions);

    return suggestions;
  }

  /**
   * Extract keywords from description
   */
  private extractKeywords(description: string): string[] {
    const words = description
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word));

    // Remove duplicates and prioritize
    return [...new Set(words)];
  }

  /**
   * Check if name is valid for domain
   */
  private isValidDomainName(name: string): boolean {
    // Must be alphanumeric
    if (!/^[a-z0-9]+$/.test(name)) return false;

    // Must not be all numbers
    if (/^[0-9]+$/.test(name)) return false;

    // Length constraints
    if (name.length < 3 || name.length > 15) return false;

    return true;
  }
}
