/**
 * Enhanced Domain Name Generator V2
 * Produces higher-quality, more brandable domain names with scoring
 */

const DomainScorer = require('./utils/domainScorer');

class DomainGeneratorV2 {
  constructor() {
    this.scorer = new DomainScorer();

    // Enhanced word lists
    this.prefixes = [
      'get', 'try', 'use', 'my', 'go', 'the', 'app', 'hey', 'do', 'be',
      'one', 'pro', 'new', 'now', 'next', 'best', 'top', 'super', 'ultra', 'mega'
    ];

    this.suffixes = [
      'app', 'hq', 'hub', 'labs', 'dev', 'pro', 'box', 'kit', 'io', 'ly',
      'base', 'zone', 'spot', 'space', 'place', 'cloud', 'ware', 'tech',
      'flow', 'wave', 'sync', 'link', 'verse', 'ify', 'able', 'ful'
    ];

    this.techTerms = [
      'cloud', 'node', 'stack', 'code', 'dev', 'tech', 'digital', 'smart',
      'quick', 'fast', 'auto', 'sync', 'real', 'live', 'instant', 'rapid',
      'data', 'info', 'net', 'web', 'cyber', 'core', 'prime', 'flex'
    ];

    // Action words (good for SaaS/tools)
    this.actionWords = [
      'build', 'create', 'make', 'share', 'send', 'track', 'manage', 'plan',
      'ship', 'launch', 'boost', 'grow', 'scale', 'connect', 'link', 'sync',
      'flow', 'stream', 'push', 'pull', 'merge', 'split', 'join', 'unite'
    ];

    // Stop words to filter out
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'that', 'this', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'should', 'could', 'may', 'might', 'can', 'must', 'shall'
    ]);
  }

  /**
   * Extract and enhance keywords from description
   */
  extractKeywords(description) {
    const words = description.toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/[\s-]+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word));

    // Prioritize important words (nouns, verbs, tech terms)
    const prioritized = [];
    const regular = [];

    for (const word of words) {
      if (this.techTerms.includes(word) || this.actionWords.includes(word)) {
        prioritized.push(word);
      } else {
        regular.push(word);
      }
    }

    return [...new Set([...prioritized, ...regular])];
  }

  /**
   * Create intelligent portmanteau with vowel awareness
   */
  createSmartPortmanteau(word1, word2) {
    const blends = [];
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);

    // Find vowel positions
    const word1Vowels = [];
    const word2Vowels = [];

    for (let i = 0; i < word1.length; i++) {
      if (vowels.has(word1[i])) word1Vowels.push(i);
    }
    for (let i = 0; i < word2.length; i++) {
      if (vowels.has(word2[i])) word2Vowels.push(i);
    }

    // Split at vowel boundaries for better pronunciation
    if (word1Vowels.length > 0 && word2Vowels.length > 0) {
      // Take first part up to last vowel of word1
      const split1 = word1Vowels[word1Vowels.length - 1] + 1;
      // Start from first consonant after first vowel of word2
      const split2 = word2Vowels[0];

      const blend = word1.slice(0, split1) + word2.slice(split2);
      if (blend.length >= 5 && blend.length <= 12) {
        blends.push(blend);
      }
    }

    // Try overlap blending (find common endings/beginnings)
    for (let overlap = 2; overlap <= Math.min(4, word1.length - 2, word2.length - 2); overlap++) {
      const end1 = word1.slice(-overlap);
      const start2 = word2.slice(0, overlap);

      if (end1 === start2) {
        const blend = word1 + word2.slice(overlap);
        if (blend.length >= 5 && blend.length <= 12) {
          blends.push(blend);
        }
      }
    }

    // Standard blending (take first 60% of word1, last 40% of word2)
    const split1 = Math.ceil(word1.length * 0.6);
    const split2 = Math.floor(word2.length * 0.4);
    const standardBlend = word1.slice(0, split1) + word2.slice(-split2);

    if (standardBlend.length >= 5 && standardBlend.length <= 12) {
      blends.push(standardBlend);
    }

    return blends;
  }

  /**
   * Generate compound words with better combinations
   */
  generateCompounds(keywords) {
    const compounds = [];

    for (let i = 0; i < Math.min(keywords.length, 4); i++) {
      for (let j = i + 1; j < Math.min(keywords.length, 5); j++) {
        const word1 = keywords[i];
        const word2 = keywords[j];

        // Direct combination
        if (word1.length + word2.length <= 14) {
          compounds.push(word1 + word2);
          compounds.push(word2 + word1);
        }

        // With action words
        for (const action of this.actionWords.slice(0, 5)) {
          if (action.length + word1.length <= 12) {
            compounds.push(action + word1);
            compounds.push(word1 + action);
          }
        }
      }
    }

    return compounds;
  }

  /**
   * Generate variations with better heuristics
   */
  generateVariations(word) {
    const variations = [word];

    // Remove vowels strategically (but keep at least one)
    if (word.length >= 6) {
      const vowelPattern = /[aeiou]/gi;
      const vowelCount = (word.match(vowelPattern) || []).length;

      if (vowelCount >= 2) {
        // Remove last vowel
        const shortened = word.replace(/[aeiou]([^aeiou]*)$/, '$1');
        if (shortened.length >= 5) {
          variations.push(shortened);
        }
      }
    }

    // Add 'ify' for verbs
    if (word.length >= 4 && word.length <= 8) {
      variations.push(word + 'ify');
    }

    // Add 'ly' for short words
    if (word.length >= 4 && word.length <= 7) {
      variations.push(word + 'ly');
    }

    return variations;
  }

  /**
   * Generate all suggestions
   */
  generate(description, options = {}) {
    const maxSuggestions = options.maxSuggestions || 30;
    const minScore = options.minScore || 55;
    const keywords = this.extractKeywords(description);
    const suggestions = new Set();

    if (keywords.length === 0) {
      throw new Error('Could not extract meaningful keywords from description');
    }

    // Strategy 1: Direct keywords (best quality)
    keywords.slice(0, 8).forEach(keyword => {
      if (keyword.length >= 4 && keyword.length <= 12) {
        suggestions.add(keyword);
      }
    });

    // Strategy 2: Smart compounds
    const compounds = this.generateCompounds(keywords);
    compounds.forEach(comp => suggestions.add(comp));

    // Strategy 3: Prefixes and suffixes (high quality)
    keywords.slice(0, 6).forEach(keyword => {
      this.prefixes.slice(0, 10).forEach(prefix => {
        if (prefix.length + keyword.length <= 12) {
          suggestions.add(prefix + keyword);
        }
      });

      this.suffixes.slice(0, 12).forEach(suffix => {
        if (keyword.length + suffix.length <= 12) {
          suggestions.add(keyword + suffix);
        }
      });
    });

    // Strategy 4: Smart portmanteaus
    for (let i = 0; i < Math.min(keywords.length, 4); i++) {
      for (let j = i + 1; j < Math.min(keywords.length, 5); j++) {
        const blends = this.createSmartPortmanteau(keywords[i], keywords[j]);
        blends.forEach(blend => suggestions.add(blend));
      }
    }

    // Strategy 5: Tech term combinations
    keywords.slice(0, 4).forEach(keyword => {
      this.techTerms.slice(0, 6).forEach(term => {
        if (keyword !== term) {
          if (keyword.length + term.length <= 12) {
            suggestions.add(keyword + term);
            suggestions.add(term + keyword);
          }
        }
      });
    });

    // Strategy 6: Variations
    keywords.slice(0, 5).forEach(keyword => {
      const variations = this.generateVariations(keyword);
      variations.forEach(v => suggestions.add(v));
    });

    // Filter, score, and rank
    const scored = Array.from(suggestions)
      .filter(name => {
        // Basic filters
        return name.length >= 4 &&
               name.length <= 15 &&
               /^[a-z0-9]+$/.test(name) &&
               !name.match(/^[0-9]+$/);
      })
      .map(name => {
        const scoring = this.scorer.score(name);
        return {
          name,
          score: scoring.overall,
          scoring
        };
      })
      .filter(item => item.score >= minScore)
      .sort((a, b) => {
        // Sort by score, then by length
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.name.length - b.name.length;
      })
      .slice(0, maxSuggestions);

    return scored;
  }

  /**
   * Generate with quality grades
   */
  generateByGrade(description, options = {}) {
    const all = this.generate(description, { ...options, maxSuggestions: 100 });

    return {
      premium: all.filter(d => d.scoring.grade.startsWith('A')),
      good: all.filter(d => d.scoring.grade.startsWith('B')),
      acceptable: all.filter(d => d.scoring.grade.startsWith('C')),
      all
    };
  }
}

module.exports = DomainGeneratorV2;
