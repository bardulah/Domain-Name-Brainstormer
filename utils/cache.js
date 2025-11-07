/**
 * Simple file-based caching system for domain availability results
 * Caches results for 24 hours to avoid repeated WHOIS lookups
 */

const fs = require('fs');
const path = require('path');

class Cache {
  constructor(cacheDuration = 24 * 60 * 60 * 1000) { // 24 hours default
    this.cacheDuration = cacheDuration;
    this.cacheDir = path.join(__dirname, '../.cache');
    this.cacheFile = path.join(this.cacheDir, 'availability-cache.json');
    this.memoryCache = new Map();
    this.ensureCacheDir();
    this.loadCache();
  }

  /**
   * Ensure cache directory exists
   */
  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Load cache from disk
   */
  loadCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        const parsed = JSON.parse(data);

        // Load into memory, filtering expired entries
        const now = Date.now();
        for (const [key, value] of Object.entries(parsed)) {
          if (value.expires > now) {
            this.memoryCache.set(key, value);
          }
        }
      }
    } catch (error) {
      // If cache is corrupted, start fresh
      console.warn('Cache load failed, starting fresh:', error.message);
      this.memoryCache.clear();
    }
  }

  /**
   * Save cache to disk
   */
  saveCache() {
    try {
      const cacheObject = {};
      for (const [key, value] of this.memoryCache.entries()) {
        cacheObject[key] = value;
      }
      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheObject, null, 2));
    } catch (error) {
      console.warn('Cache save failed:', error.message);
    }
  }

  /**
   * Generate cache key for a domain
   */
  getCacheKey(domain) {
    return domain.toLowerCase();
  }

  /**
   * Get cached result
   */
  get(domain) {
    const key = this.getCacheKey(domain);
    const cached = this.memoryCache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (cached.expires < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache entry
   */
  set(domain, data) {
    const key = this.getCacheKey(domain);
    const entry = {
      data,
      expires: Date.now() + this.cacheDuration,
      cached_at: Date.now()
    };

    this.memoryCache.set(key, entry);

    // Periodically save to disk (not on every write for performance)
    if (Math.random() < 0.1) { // 10% chance
      this.saveCache();
    }
  }

  /**
   * Check if domain is cached
   */
  has(domain) {
    return this.get(domain) !== null;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memoryCache.clear();
    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
      }
    } catch (error) {
      console.warn('Cache clear failed:', error.message);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let validEntries = 0;
    let expiredEntries = 0;
    const now = Date.now();

    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expires > now) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      total: this.memoryCache.size,
      valid: validEntries,
      expired: expiredEntries,
      cacheFile: this.cacheFile
    };
  }

  /**
   * Clean expired entries
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expires < now) {
        this.memoryCache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.saveCache();
    }

    return removed;
  }

  /**
   * Force save cache to disk
   */
  flush() {
    this.saveCache();
  }
}

module.exports = Cache;
