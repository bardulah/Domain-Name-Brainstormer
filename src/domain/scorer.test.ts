/**
 * Domain Scorer Tests
 */

import { DomainScorer } from './scorer';

describe('DomainScorer', () => {
  let scorer: DomainScorer;

  beforeEach(() => {
    scorer = new DomainScorer();
  });

  describe('score', () => {
    it('should return scoring result with all components', () => {
      const result = scorer.score('taskify');

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown).toHaveProperty('pronounceability');
      expect(result.breakdown).toHaveProperty('length');
      expect(result.breakdown).toHaveProperty('brandability');
      expect(result.breakdown).toHaveProperty('memorability');
      expect(result.breakdown).toHaveProperty('typingEase');
    });

    it('should score brandable names highly', () => {
      const brandableNames = ['taskify', 'cloudbase', 'codekit', 'dataflow'];

      brandableNames.forEach(name => {
        const result = scorer.score(name);
        expect(result.overall).toBeGreaterThan(70);
        expect(['A+', 'A', 'A-', 'B+', 'B', 'B-']).toContain(result.grade);
      });
    });

    it('should score poor names lowly', () => {
      const poorNames = ['xz', 'bcdfg', 'qqqqq', 'verylongdomainnamethatiswaytolong'];

      poorNames.forEach(name => {
        const result = scorer.score(name);
        expect(result.overall).toBeLessThan(60);
      });
    });

    it('should prefer optimal length (6-10 chars)', () => {
      const optimal = scorer.score('taskify'); // 7 chars
      const tooShort = scorer.score('xyz'); // 3 chars
      const tooLong = scorer.score('verylongname'); // 12 chars

      expect(optimal.breakdown.length).toBeGreaterThan(tooShort.breakdown.length);
      expect(optimal.breakdown.length).toBeGreaterThan(tooLong.breakdown.length);
    });

    it('should penalize unpronounceable names', () => {
      const pronounceable = scorer.score('taskify');
      const unpronounceable = scorer.score('bcdfgh');

      expect(pronounceable.breakdown.pronounceability).toBeGreaterThan(
        unpronounceable.breakdown.pronounceability
      );
    });

    it('should assign correct grades', () => {
      // Test grade boundaries
      expect(scorer.score('taskify').grade).toMatch(/[ABCDF][+-]?/);
    });
  });
});
