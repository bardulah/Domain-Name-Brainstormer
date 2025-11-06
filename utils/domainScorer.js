/**
 * Domain Name Scoring System
 * Ranks domain names based on multiple quality factors
 */

const PronounceabilityScorer = require('./pronounceability');

class DomainScorer {
  constructor() {
    this.pronounceabilityScorer = new PronounceabilityScorer();

    // Common tech/business terms (considered good)
    this.positiveTerms = new Set([
      'app', 'hub', 'lab', 'kit', 'dev', 'tech', 'cloud', 'smart', 'fast', 'easy',
      'pro', 'max', 'plus', 'base', 'core', 'link', 'sync', 'flow', 'wave', 'spark',
      'quest', 'shift', 'boost', 'launch', 'vision', 'pulse', 'nexus', 'vertex'
    ]);

    // Real word patterns (partial matching)
    this.realWordParts = [
      'task', 'chat', 'social', 'cloud', 'code', 'data', 'team', 'work',
      'shop', 'store', 'mail', 'book', 'note', 'file', 'doc', 'form',
      'plan', 'track', 'manage', 'build', 'create', 'share', 'connect'
    ];
  }

  /**
   * Score based on domain length
   */
  scorelength(name) {
    const len = name.length;

    if (len >= 6 && len <= 8) return 100; // Perfect length
    if (len >= 5 && len <= 10) return 85;
    if (len >= 4 && len <= 12) return 70;
    if (len === 13) return 55;
    if (len === 14) return 40;
    if (len >= 15) return 20;
    if (len === 4) return 60;
    return 30; // Very short (3 or less)
  }

  /**
   * Score based on memorability
   */
  scoreMemorability(name) {
    let score = 50;

    // Has repeated letters (aids memory)
    if (/(.)\1/.test(name)) {
      score += 10;
    }

    // Contains common patterns
    if (/ing$|er$|ly$|ed$/.test(name)) {
      score += 10;
    }

    // Too many repeated patterns is bad
    if (/(.)\1{2,}/.test(name)) {
      score -= 20;
    }

    // All same character is terrible
    if (/^(.)\1+$/.test(name)) {
      score = 0;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score based on brandability
   */
  scoreBrandability(name) {
    let score = 50;

    // Contains positive tech terms
    for (const term of this.positiveTerms) {
      if (name.includes(term)) {
        score += 15;
        break;
      }
    }

    // Contains real word parts
    for (const word of this.realWordParts) {
      if (name.includes(word)) {
        score += 10;
        break;
      }
    }

    // Starts with capital-friendly letter
    if (/^[A-Z]/.test(name[0].toUpperCase())) {
      score += 5;
    }

    // Unique character ratio (not too many repeated chars)
    const uniqueChars = new Set(name.split('')).size;
    const uniqueRatio = uniqueChars / name.length;
    if (uniqueRatio >= 0.6) {
      score += 10;
    } else if (uniqueRatio < 0.4) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score based on typing ease
   */
  scoreTypingEase(name) {
    let score = 70;

    // Alternating hand typing (simplified heuristic)
    // Left hand: qwertasdfgzxcvb
    // Right hand: yuiophjklnm
    const leftHand = new Set('qwertasdfgzxcvb'.split(''));
    const rightHand = new Set('yuiophjklnm'.split(''));

    let alternations = 0;
    let lastHand = null;

    for (const char of name.toLowerCase()) {
      const currentHand = leftHand.has(char) ? 'left' :
                         rightHand.has(char) ? 'right' : null;
      if (currentHand && lastHand && currentHand !== lastHand) {
        alternations++;
      }
      lastHand = currentHand;
    }

    const alternationRatio = alternations / Math.max(1, name.length - 1);
    if (alternationRatio >= 0.5) {
      score += 20;
    } else if (alternationRatio >= 0.3) {
      score += 10;
    }

    // Avoid awkward key combinations
    const awkwardPatterns = [
      /qz|zq|xz|zx/i, // Awkward combos
      /[^aeiou]{4,}/i // Too many consonants
    ];

    for (const pattern of awkwardPatterns) {
      if (pattern.test(name)) {
        score -= 15;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Comprehensive domain quality score
   */
  score(name) {
    const weights = {
      pronounceability: 0.30,
      length: 0.25,
      brandability: 0.20,
      memorability: 0.15,
      typingEase: 0.10
    };

    const scores = {
      pronounceability: this.pronounceabilityScorer.score(name),
      length: this.scorelength(name),
      brandability: this.scoreBrandability(name),
      memorability: this.scoreMemorability(name),
      typingEase: this.scoreTypingEase(name)
    };

    // Calculate weighted average
    let totalScore = 0;
    for (const [factor, weight] of Object.entries(weights)) {
      totalScore += scores[factor] * weight;
    }

    return {
      overall: Math.round(totalScore),
      breakdown: scores,
      grade: this.getGrade(totalScore)
    };
  }

  /**
   * Get letter grade for score
   */
  getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Filter and rank domain names
   */
  rankDomains(names, minScore = 50) {
    return names
      .map(name => ({
        name,
        scoring: this.score(name)
      }))
      .filter(item => item.scoring.overall >= minScore)
      .sort((a, b) => b.scoring.overall - a.scoring.overall);
  }
}

module.exports = DomainScorer;
