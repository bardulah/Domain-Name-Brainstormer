/**
 * Tests for Domain Scorer
 */

const DomainScorer = require('../utils/domainScorer');

describe('DomainScorer', () => {
  let scorer;

  beforeEach(() => {
    scorer = new DomainScorer();
  });

  describe('score', () => {
    test('should return score with breakdown', () => {
      const result = scorer.score('taskify');

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('grade');
      expect(result.overall).toBeGreaterThan(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    test('should score good domain names highly', () => {
      const goodNames = ['taskify', 'cloudbase', 'codeflow', 'datakit'];

      for (const name of goodNames) {
        const result = scorer.score(name);
        expect(result.overall).toBeGreaterThan(60);
      }
    });

    test('should score poor domain names lowly', () => {
      const poorNames = ['xz', 'verylongdomainnamethatistoolong', 'zzz', 'qqqq'];

      for (const name of poorNames) {
        const result = scorer.score(name);
        expect(result.overall).toBeLessThan(60);
      }
    });
  });

  describe('scorelength', () => {
    test('should prefer medium-length names', () => {
      expect(scorer.scorelength('taskify')).toBeGreaterThan(80); // 7 chars
      expect(scorer.scorelength('code')).toBeLessThan(80); // 4 chars
      expect(scorer.scorelength('verylongname')).toBeLessThan(80); // 12+ chars
    });
  });

  describe('getGrade', () => {
    test('should assign correct grades', () => {
      expect(scorer.getGrade(95)).toBe('A+');
      expect(scorer.getGrade(85)).toBe('A');
      expect(scorer.getGrade(75)).toBe('B+');
      expect(scorer.getGrade(65)).toBe('B-');
      expect(scorer.getGrade(55)).toBe('C');
      expect(scorer.getGrade(35)).toBe('F');
    });
  });

  describe('rankDomains', () => {
    test('should rank domains by score', () => {
      const names = ['taskify', 'xz', 'cloudbase', 'zzz'];
      const ranked = scorer.rankDomains(names, 50);

      expect(ranked.length).toBeGreaterThan(0);
      expect(ranked.length).toBeLessThanOrEqual(names.length);

      // Should be sorted by score descending
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i - 1].scoring.overall).toBeGreaterThanOrEqual(ranked[i].scoring.overall);
      }
    });

    test('should filter by minimum score', () => {
      const names = ['taskify', 'xz', 'cloudbase'];
      const ranked = scorer.rankDomains(names, 70);

      for (const item of ranked) {
        expect(item.scoring.overall).toBeGreaterThanOrEqual(70);
      }
    });
  });
});
