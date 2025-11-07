/**
 * Pronounceability Scoring System
 * Determines how easy a domain name is to pronounce and remember
 */

class PronounceabilityScorer {
  constructor() {
    this.vowels = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
    this.consonants = new Set('bcdfghjklmnpqrstvwxz'.split(''));

    // Common pronounceable patterns
    this.goodPatterns = [
      /^[bcdfghjklmnpqrstvwxz][aeiou]/i, // Consonant-vowel start
      /[aeiou][bcdfghjklmnpqrstvwxz]$/i, // Vowel-consonant end
      /[aeiou]{2}/i, // Double vowels (like 'ea', 'oo')
    ];

    // Bad patterns that make words hard to pronounce
    this.badPatterns = [
      /[bcdfghjklmnpqrstvwxz]{4,}/i, // 4+ consonants in a row
      /[^aeiou]{5,}/i, // 5+ non-vowels in a row
      /^[bcdfghjklmnpqrstvwxz]{3}/i, // 3+ consonants at start
    ];
  }

  /**
   * Calculate vowel to consonant ratio
   */
  getVowelConsonantRatio(word) {
    let vowelCount = 0;
    let consonantCount = 0;

    for (const char of word.toLowerCase()) {
      if (this.vowels.has(char)) vowelCount++;
      else if (this.consonants.has(char)) consonantCount++;
    }

    if (consonantCount === 0) return 0;
    return vowelCount / consonantCount;
  }

  /**
   * Check for consecutive consonants/vowels
   */
  hasGoodVowelConsonantPattern(word) {
    const lower = word.toLowerCase();
    let maxConsonants = 0;
    let maxVowels = 0;
    let currentConsonants = 0;
    let currentVowels = 0;

    for (const char of lower) {
      if (this.vowels.has(char)) {
        currentVowels++;
        maxConsonants = Math.max(maxConsonants, currentConsonants);
        currentConsonants = 0;
      } else if (this.consonants.has(char)) {
        currentConsonants++;
        maxVowels = Math.max(maxVowels, currentVowels);
        currentVowels = 0;
      }
    }

    maxConsonants = Math.max(maxConsonants, currentConsonants);
    maxVowels = Math.max(maxVowels, currentVowels);

    // Good pattern: max 3 consonants or 2 vowels in a row
    return maxConsonants <= 3 && maxVowels <= 2;
  }

  /**
   * Check for common syllable patterns
   */
  hasSyllableStructure(word) {
    // Simple syllable detection: look for vowel clusters
    const vowelClusters = word.match(/[aeiouy]+/gi);
    if (!vowelClusters) return false;

    const syllableCount = vowelClusters.length;
    const wordLength = word.length;

    // Ideal: 2-3 syllables for words of 6-12 characters
    if (wordLength >= 6 && wordLength <= 12) {
      return syllableCount >= 2 && syllableCount <= 4;
    }

    // Shorter words can have fewer syllables
    return syllableCount >= 1 && syllableCount <= 3;
  }

  /**
   * Score pronounceability from 0-100
   */
  score(word) {
    if (word.length < 3) return 20;
    if (word.length > 20) return 10;

    let score = 50; // Base score

    // 1. Vowel-consonant ratio (ideal: 0.4-0.8)
    const ratio = this.getVowelConsonantRatio(word);
    if (ratio >= 0.4 && ratio <= 0.8) {
      score += 20;
    } else if (ratio >= 0.3 && ratio <= 1.0) {
      score += 10;
    } else {
      score -= 15;
    }

    // 2. Pattern checking
    if (this.hasGoodVowelConsonantPattern(word)) {
      score += 15;
    } else {
      score -= 20;
    }

    // 3. Syllable structure
    if (this.hasSyllableStructure(word)) {
      score += 15;
    }

    // 4. Good patterns
    for (const pattern of this.goodPatterns) {
      if (pattern.test(word)) {
        score += 5;
      }
    }

    // 5. Bad patterns
    for (const pattern of this.badPatterns) {
      if (pattern.test(word)) {
        score -= 25;
      }
    }

    // 6. Length bonus (sweet spot: 6-10 characters)
    if (word.length >= 6 && word.length <= 10) {
      score += 10;
    } else if (word.length >= 11 && word.length <= 12) {
      score += 5;
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if word is pronounceable (score >= 60)
   */
  isPronounceable(word) {
    return this.score(word) >= 60;
  }
}

module.exports = PronounceabilityScorer;
