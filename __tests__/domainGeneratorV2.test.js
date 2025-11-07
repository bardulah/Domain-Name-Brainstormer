/**
 * Tests for Enhanced Domain Generator V2
 */

const DomainGeneratorV2 = require('../domainGeneratorV2');

describe('DomainGeneratorV2', () => {
  let generator;

  beforeEach(() => {
    generator = new DomainGeneratorV2();
  });

  describe('extractKeywords', () => {
    test('should extract keywords from description', () => {
      const keywords = generator.extractKeywords('AI-powered task manager for teams');

      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords).toContain('task');
      expect(keywords).toContain('manager');
      expect(keywords).not.toContain('for'); // stop word
    });

    test('should prioritize tech terms', () => {
      const keywords = generator.extractKeywords('cloud storage solution');

      expect(keywords[0]).toBe('cloud'); // tech term should be first
    });

    test('should handle empty or invalid input', () => {
      expect(() => generator.extractKeywords('')).not.toThrow();
      expect(() => generator.extractKeywords('the and or')).not.toThrow();
    });
  });

  describe('createSmartPortmanteau', () => {
    test('should create word blends', () => {
      const blends = generator.createSmartPortmanteau('task', 'manager');

      expect(Array.isArray(blends)).toBe(true);
      expect(blends.length).toBeGreaterThan(0);

      for (const blend of blends) {
        expect(blend.length).toBeGreaterThanOrEqual(5);
        expect(blend.length).toBeLessThanOrEqual(12);
      }
    });
  });

  describe('generate', () => {
    test('should generate domain suggestions', () => {
      const suggestions = generator.generate('cloud storage solution', {
        maxSuggestions: 10
      });

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    test('should include scores for suggestions', () => {
      const suggestions = generator.generate('task manager', {
        maxSuggestions: 5
      });

      for (const suggestion of suggestions) {
        expect(suggestion).toHaveProperty('name');
        expect(suggestion).toHaveProperty('score');
        expect(suggestion).toHaveProperty('scoring');
        expect(suggestion.score).toBeGreaterThan(0);
      }
    });

    test('should filter by minimum score', () => {
      const suggestions = generator.generate('developer tools', {
        maxSuggestions: 20,
        minScore: 70
      });

      for (const suggestion of suggestions) {
        expect(suggestion.score).toBeGreaterThanOrEqual(70);
      }
    });

    test('should sort by score descending', () => {
      const suggestions = generator.generate('project management', {
        maxSuggestions: 10
      });

      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].score).toBeGreaterThanOrEqual(suggestions[i].score);
      }
    });

    test('should throw error for empty description', () => {
      expect(() => generator.generate('the and or')).toThrow();
    });
  });

  describe('generateByGrade', () => {
    test('should group suggestions by grade', () => {
      const result = generator.generateByGrade('AI chatbot', {
        maxSuggestions: 20
      });

      expect(result).toHaveProperty('premium');
      expect(result).toHaveProperty('good');
      expect(result).toHaveProperty('acceptable');
      expect(result).toHaveProperty('all');

      expect(Array.isArray(result.premium)).toBe(true);
      expect(Array.isArray(result.good)).toBe(true);
      expect(Array.isArray(result.acceptable)).toBe(true);
    });
  });

  describe('generateCompounds', () => {
    test('should create compound words', () => {
      const compounds = generator.generateCompounds(['task', 'manager', 'cloud']);

      expect(Array.isArray(compounds)).toBe(true);
      expect(compounds.length).toBeGreaterThan(0);

      for (const compound of compounds) {
        expect(compound.length).toBeGreaterThan(3);
        expect(compound.length).toBeLessThanOrEqual(14);
      }
    });
  });
});
