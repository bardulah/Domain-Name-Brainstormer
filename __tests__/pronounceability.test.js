/**
 * Tests for Pronounceability Scorer
 */

const PronounceabilityScorer = require('../utils/pronounceability');

describe('PronounceabilityScorer', () => {
  let scorer;

  beforeEach(() => {
    scorer = new PronounceabilityScorer();
  });

  describe('score', () => {
    test('should score pronounceable words highly', () => {
      expect(scorer.score('hello')).toBeGreaterThan(60);
      expect(scorer.score('taskify')).toBeGreaterThan(60);
      expect(scorer.score('cloudbase')).toBeGreaterThan(60);
    });

    test('should score unpronounceable words lowly', () => {
      expect(scorer.score('xzzqrt')).toBeLessThan(40);
      expect(scorer.score('bcdfgh')).toBeLessThan(40);
      expect(scorer.score('prms')).toBeLessThan(60);
    });

    test('should handle edge cases', () => {
      expect(scorer.score('a')).toBeLessThan(30);
      expect(scorer.score('verylongdomainnamethatishard')).toBeLessThan(40);
      expect(scorer.score('')).toBeLessThan(30);
    });
  });

  describe('isPronounceable', () => {
    test('should identify pronounceable words', () => {
      expect(scorer.isPronounceable('hello')).toBe(true);
      expect(scorer.isPronounceable('cloudify')).toBe(true);
    });

    test('should identify unpronounceable words', () => {
      expect(scorer.isPronounceable('xzzqrt')).toBe(false);
      expect(scorer.isPronounceable('bcdfgh')).toBe(false);
    });
  });

  describe('getVowelConsonantRatio', () => {
    test('should calculate correct ratios', () => {
      expect(scorer.getVowelConsonantRatio('hello')).toBeCloseTo(0.67, 1);
      expect(scorer.getVowelConsonantRatio('task')).toBeCloseTo(0.33, 1);
    });
  });

  describe('hasGoodVowelConsonantPattern', () => {
    test('should identify good patterns', () => {
      expect(scorer.hasGoodVowelConsonantPattern('hello')).toBe(true);
      expect(scorer.hasGoodVowelConsonantPattern('taskify')).toBe(true);
    });

    test('should identify bad patterns', () => {
      expect(scorer.hasGoodVowelConsonantPattern('strength')).toBe(false); // too many consonants
    });
  });
});
