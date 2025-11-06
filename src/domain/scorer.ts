/**
 * Domain Quality Scorer
 *
 * IMPORTANT: This scoring system is heuristic-based and NOT validated
 * against real-world domain success data. Use as a guide, not gospel.
 *
 * Scoring factors:
 * 1. Length: Shorter is generally better (6-10 chars optimal)
 * 2. Pronounceability: Has reasonable vowel-consonant balance
 * 3. Brandability: Looks like a real brand name
 * 4. Memorability: Easy to remember patterns
 * 5. Typing ease: Alternating hands, no awkward sequences
 */

import { ScoringResult, ScoreBreakdown, Grade, IDomainScorer } from './types';

export class DomainScorer implements IDomainScorer {
  private readonly vowels = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

  /**
   * Score a domain name
   */
  score(name: string): ScoringResult {
    const breakdown: ScoreBreakdown = {
      pronounceability: this.scorePronounceability(name),
      length: this.scoreLength(name),
      brandability: this.scoreBrandability(name),
      memorability: this.scoreMemorability(name),
      typingEase: this.scoreTypingEase(name)
    };

    // Weighted average (simpler, more transparent weights)
    const overall = Math.round(
      breakdown.pronounceability * 0.30 +
      breakdown.length * 0.25 +
      breakdown.brandability * 0.20 +
      breakdown.memorability * 0.15 +
      breakdown.typingEase * 0.10
    );

    return {
      overall,
      grade: this.getGrade(overall),
      breakdown
    };
  }

  /**
   * Score pronounceability based on vowel-consonant balance
   */
  private scorePronounceability(name: string): number {
    if (name.length < 3) return 20;
    if (name.length > 15) return 30;

    let vowelCount = 0;
    let consonantCount = 0;
    let maxConsecutiveConsonants = 0;
    let currentConsecutiveConsonants = 0;

    for (const char of name.toLowerCase()) {
      if (this.vowels.has(char)) {
        vowelCount++;
        maxConsecutiveConsonants = Math.max(maxConsecutiveConsonants, currentConsecutiveConsonants);
        currentConsecutiveConsonants = 0;
      } else if (/[a-z]/.test(char)) {
        consonantCount++;
        currentConsecutiveConsonants++;
      }
    }

    maxConsecutiveConsonants = Math.max(maxConsecutiveConsonants, currentConsecutiveConsonants);

    // Calculate vowel ratio
    const totalLetters = vowelCount + consonantCount;
    if (totalLetters === 0) return 0;

    const vowelRatio = vowelCount / totalLetters;

    let score = 50;

    // Ideal vowel ratio: 35-45%
    if (vowelRatio >= 0.35 && vowelRatio <= 0.45) {
      score += 30;
    } else if (vowelRatio >= 0.25 && vowelRatio <= 0.55) {
      score += 15;
    } else {
      score -= 20;
    }

    // Penalize too many consecutive consonants
    if (maxConsecutiveConsonants >= 4) {
      score -= 30;
    } else if (maxConsecutiveConsonants === 3) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score based on length (6-10 chars is ideal)
   */
  private scoreLength(name: string): number {
    const len = name.length;

    if (len >= 6 && len <= 8) return 100; // Sweet spot
    if (len === 9 || len === 10) return 90;
    if (len === 5 || len === 11) return 75;
    if (len === 4 || len === 12) return 60;
    if (len === 13) return 45;
    if (len === 14) return 30;
    if (len >= 15) return 20;

    return 40; // Very short (3 or less)
  }

  /**
   * Score brandability (looks professional)
   */
  private scoreBrandability(name: string): number {
    let score = 50;

    // Check for common tech suffixes
    const goodSuffixes = ['ify', 'ly', 'io', 'app', 'hub', 'kit', 'box', 'base', 'flow'];
    if (goodSuffixes.some(suffix => name.endsWith(suffix))) {
      score += 20;
    }

    // Check for all lowercase (professional looking)
    if (name === name.toLowerCase()) {
      score += 10;
    }

    // Check character diversity
    const uniqueChars = new Set(name).size;
    const diversityRatio = uniqueChars / name.length;
    if (diversityRatio >= 0.6) {
      score += 15;
    }

    // Penalize numbers
    if (/\d/.test(name)) {
      score -= 20;
    }

    // Penalize hyphens
    if (/-/.test(name)) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score memorability
   */
  private scoreMemorability(name: string): number {
    let score = 50;

    // Some repetition aids memory
    if (/(.)\1/.test(name)) {
      score += 15;
    }

    // But too much is bad
    if (/(.)\1{2,}/.test(name)) {
      score -= 25;
    }

    // Common patterns help
    if (/^[a-z]{2,4}(ify|ly|er|ing)$/.test(name)) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score typing ease (very simplified)
   */
  private scoreTypingEase(name: string): number {
    let score = 70;

    // Penalize awkward letter combinations
    const awkward = ['qz', 'xz', 'zx', 'qx'];
    if (awkward.some(combo => name.includes(combo))) {
      score -= 30;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Convert score to grade
   */
  private getGrade(score: number): Grade {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D';
    return 'F';
  }
}
