/**
 * Domain Name Generator
 * Generates creative domain name suggestions based on project descriptions
 */

class DomainGenerator {
  constructor() {
    // Common prefixes and suffixes for domain names
    this.prefixes = ['get', 'try', 'use', 'my', 'go', 'the', 'app', 'hey'];
    this.suffixes = ['app', 'hq', 'hub', 'labs', 'dev', 'pro', 'box', 'kit', 'io', 'ly'];

    // Tech-related terms
    this.techTerms = ['cloud', 'node', 'stack', 'code', 'dev', 'tech', 'digital', 'smart', 'quick', 'fast'];

    // Common word replacements for creative spelling
    this.replacements = {
      'er': ['r', 'ar'],
      'or': ['r', 'ar'],
      'tion': ['shun'],
      'you': ['u'],
      'oo': ['u'],
      'ea': ['ee'],
      'ph': ['f'],
      'ck': ['k']
    };
  }

  /**
   * Extract keywords from project description
   */
  extractKeywords(description) {
    // Remove common words and extract meaningful keywords
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'that', 'this', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can'];

    const words = description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    return [...new Set(words)];
  }

  /**
   * Generate portmanteau (blend) of two words
   */
  createPortmanteau(word1, word2) {
    const blends = [];

    // Take first part of word1 and last part of word2
    for (let i = 2; i <= Math.min(word1.length - 1, 5); i++) {
      for (let j = 1; j <= Math.min(word2.length - 2, 4); j++) {
        const blend = word1.slice(0, i) + word2.slice(j);
        if (blend.length >= 4 && blend.length <= 15) {
          blends.push(blend);
        }
      }
    }

    return blends;
  }

  /**
   * Apply creative spelling variations
   */
  applyCreativeSpelling(word) {
    const variations = [word];

    for (const [pattern, replacements] of Object.entries(this.replacements)) {
      if (word.includes(pattern)) {
        for (const replacement of replacements) {
          variations.push(word.replace(pattern, replacement));
        }
      }
    }

    return variations;
  }

  /**
   * Generate acronyms from keywords
   */
  generateAcronyms(keywords) {
    const acronyms = [];

    if (keywords.length >= 2) {
      // Take first letters
      const acronym = keywords.map(w => w[0]).join('');
      if (acronym.length >= 2 && acronym.length <= 6) {
        acronyms.push(acronym);
      }

      // Take first 2 letters of each word
      if (keywords.length === 2) {
        const twoLetterAcronym = keywords.map(w => w.slice(0, 2)).join('');
        acronyms.push(twoLetterAcronym);
      }
    }

    return acronyms;
  }

  /**
   * Generate domain names from project description
   */
  generate(description, options = {}) {
    const maxSuggestions = options.maxSuggestions || 30;
    const keywords = this.extractKeywords(description);
    const suggestions = new Set();

    if (keywords.length === 0) {
      throw new Error('Could not extract meaningful keywords from description');
    }

    // Strategy 1: Use keywords directly
    keywords.forEach(keyword => {
      suggestions.add(keyword);
    });

    // Strategy 2: Combine keywords
    for (let i = 0; i < keywords.length; i++) {
      for (let j = i + 1; j < Math.min(keywords.length, i + 3); j++) {
        suggestions.add(keywords[i] + keywords[j]);
        suggestions.add(keywords[j] + keywords[i]);
      }
    }

    // Strategy 3: Add prefixes and suffixes
    keywords.slice(0, 5).forEach(keyword => {
      this.prefixes.forEach(prefix => {
        suggestions.add(prefix + keyword);
      });
      this.suffixes.forEach(suffix => {
        suggestions.add(keyword + suffix);
      });
    });

    // Strategy 4: Create portmanteaus
    if (keywords.length >= 2) {
      for (let i = 0; i < Math.min(keywords.length, 3); i++) {
        for (let j = i + 1; j < Math.min(keywords.length, 4); j++) {
          const blends = this.createPortmanteau(keywords[i], keywords[j]);
          blends.forEach(blend => suggestions.add(blend));
        }
      }
    }

    // Strategy 5: Add tech terms
    keywords.slice(0, 3).forEach(keyword => {
      this.techTerms.slice(0, 3).forEach(term => {
        suggestions.add(keyword + term);
        suggestions.add(term + keyword);
      });
    });

    // Strategy 6: Generate acronyms
    const acronyms = this.generateAcronyms(keywords.slice(0, 4));
    acronyms.forEach(acronym => suggestions.add(acronym));

    // Strategy 7: Apply creative spelling to top keywords
    keywords.slice(0, 5).forEach(keyword => {
      const variations = this.applyCreativeSpelling(keyword);
      variations.forEach(v => suggestions.add(v));
    });

    // Filter and clean suggestions
    const cleaned = Array.from(suggestions)
      .filter(name => {
        // Filter out invalid domain names
        return name.length >= 3 &&
               name.length <= 30 &&
               /^[a-z0-9]+$/.test(name) &&
               !name.match(/^[0-9]+$/); // Not all numbers
      })
      .sort((a, b) => {
        // Prefer shorter names
        if (a.length !== b.length) {
          return a.length - b.length;
        }
        return a.localeCompare(b);
      })
      .slice(0, maxSuggestions);

    return cleaned;
  }
}

module.exports = DomainGenerator;
