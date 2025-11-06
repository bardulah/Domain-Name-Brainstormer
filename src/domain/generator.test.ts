/**
 * Domain Generator Tests
 */

import { DomainGenerator } from './generator';
import { DomainScorer } from './scorer';

describe('DomainGenerator', () => {
  let generator: DomainGenerator;
  let scorer: DomainScorer;

  beforeEach(() => {
    scorer = new DomainScorer();
    generator = new DomainGenerator(scorer);
  });

  describe('generate', () => {
    it('should generate domain suggestions', () => {
      const suggestions = generator.generate('cloud storage solution', {
        maxSuggestions: 10
      });

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    it('should include score and scoring for each suggestion', () => {
      const suggestions = generator.generate('task manager');

      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('name');
        expect(suggestion).toHaveProperty('score');
        expect(suggestion).toHaveProperty('scoring');
        expect(typeof suggestion.score).toBe('number');
        expect(suggestion.score).toBeGreaterThanOrEqual(0);
        expect(suggestion.score).toBeLessThanOrEqual(100);
      });
    });

    it('should filter by minimum score', () => {
      const suggestions = generator.generate('developer tools', {
        maxSuggestions: 20,
        minScore: 70
      });

      suggestions.forEach(suggestion => {
        expect(suggestion.score).toBeGreaterThanOrEqual(70);
      });
    });

    it('should sort suggestions by score descending', () => {
      const suggestions = generator.generate('project management', {
        maxSuggestions: 10
      });

      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].score).toBeGreaterThanOrEqual(suggestions[i].score);
      }
    });

    it('should throw error for empty or meaningless description', () => {
      expect(() => generator.generate('the and or')).toThrow();
      expect(() => generator.generate('')).toThrow();
      expect(() => generator.generate('   ')).toThrow();
    });

    it('should extract keywords correctly', () => {
      // Indirect test through generation
      const suggestions = generator.generate('AI-powered task manager for teams');

      expect(suggestions.length).toBeGreaterThan(0);

      // Check that generated names contain parts of keywords
      const names = suggestions.map(s => s.name).join(' ');
      expect(names.toLowerCase()).toMatch(/task|manager|team|power/);
    });

    it('should respect maxSuggestions option', () => {
      const suggestions5 = generator.generate('cloud storage', { maxSuggestions: 5 });
      const suggestions15 = generator.generate('cloud storage', { maxSuggestions: 15 });

      expect(suggestions5.length).toBeLessThanOrEqual(5);
      expect(suggestions15.length).toBeLessThanOrEqual(15);
    });

    it('should only generate valid domain names', () => {
      const suggestions = generator.generate('test project');

      suggestions.forEach(suggestion => {
        // Must be alphanumeric only
        expect(suggestion.name).toMatch(/^[a-z0-9]+$/);

        // Must not be all numbers
        expect(suggestion.name).not.toMatch(/^[0-9]+$/);

        // Must be reasonable length
        expect(suggestion.name.length).toBeGreaterThanOrEqual(3);
        expect(suggestion.name.length).toBeLessThanOrEqual(15);
      });
    });
  });
});
