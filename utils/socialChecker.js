/**
 * Social Media Handle Availability Checker
 * Checks if usernames are available on popular platforms
 */

const https = require('https');
const http = require('http');

class SocialChecker {
  constructor(options = {}) {
    this.timeout = options.timeout || 5000;
    this.maxConcurrent = options.maxConcurrent || 5;
  }

  /**
   * Make HTTP/HTTPS request
   */
  async makeRequest(url, method = 'GET', useHttp = false) {
    return new Promise((resolve, reject) => {
      const protocol = useHttp ? http : https;
      const timeout = setTimeout(() => {
        reject(new Error('Timeout'));
      }, this.timeout);

      const req = protocol.request(url, { method, timeout: this.timeout }, (res) => {
        clearTimeout(timeout);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          url: res.url || url
        });
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Check GitHub username availability
   */
  async checkGitHub(username) {
    try {
      const response = await this.makeRequest(
        `https://github.com/${username}`
      );

      // 404 = available, 200 = taken
      return {
        platform: 'GitHub',
        username,
        available: response.statusCode === 404,
        url: `https://github.com/${username}`,
        status: response.statusCode === 404 ? 'available' : 'taken'
      };
    } catch (error) {
      return {
        platform: 'GitHub',
        username,
        available: null,
        url: `https://github.com/${username}`,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Check Twitter/X username availability
   * Note: Twitter's API requires authentication, so we check the profile page
   */
  async checkTwitter(username) {
    try {
      const response = await this.makeRequest(
        `https://twitter.com/${username}`
      );

      // Twitter returns 200 even for non-existent users, but redirects
      // This is a simplified check - may not be 100% accurate
      return {
        platform: 'Twitter/X',
        username,
        available: null, // Can't reliably determine without API
        url: `https://twitter.com/${username}`,
        status: 'check_manually',
        note: 'Requires manual verification'
      };
    } catch (error) {
      return {
        platform: 'Twitter/X',
        username,
        available: null,
        url: `https://twitter.com/${username}`,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Check Instagram username availability
   */
  async checkInstagram(username) {
    try {
      const response = await this.makeRequest(
        `https://www.instagram.com/${username}/`
      );

      // Instagram returns 404 for non-existent users
      return {
        platform: 'Instagram',
        username,
        available: response.statusCode === 404,
        url: `https://www.instagram.com/${username}/`,
        status: response.statusCode === 404 ? 'available' : 'taken'
      };
    } catch (error) {
      return {
        platform: 'Instagram',
        username,
        available: null,
        url: `https://www.instagram.com/${username}/`,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Check Reddit username availability
   */
  async checkReddit(username) {
    try {
      const response = await this.makeRequest(
        `https://www.reddit.com/user/${username}/about.json`
      );

      return {
        platform: 'Reddit',
        username,
        available: response.statusCode === 404,
        url: `https://www.reddit.com/user/${username}`,
        status: response.statusCode === 404 ? 'available' : 'taken'
      };
    } catch (error) {
      return {
        platform: 'Reddit',
        username,
        available: null,
        url: `https://www.reddit.com/user/${username}`,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Check npm package name availability
   */
  async checkNpm(packageName) {
    try {
      const response = await this.makeRequest(
        `https://registry.npmjs.org/${packageName}`
      );

      return {
        platform: 'npm',
        username: packageName,
        available: response.statusCode === 404,
        url: `https://www.npmjs.com/package/${packageName}`,
        status: response.statusCode === 404 ? 'available' : 'taken'
      };
    } catch (error) {
      return {
        platform: 'npm',
        username: packageName,
        available: null,
        url: `https://www.npmjs.com/package/${packageName}`,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Check single handle across all platforms
   */
  async checkHandle(handle, platforms = ['github', 'twitter', 'instagram']) {
    const results = [];

    const checks = [];
    if (platforms.includes('github')) {
      checks.push(this.checkGitHub(handle));
    }
    if (platforms.includes('twitter')) {
      checks.push(this.checkTwitter(handle));
    }
    if (platforms.includes('instagram')) {
      checks.push(this.checkInstagram(handle));
    }
    if (platforms.includes('reddit')) {
      checks.push(this.checkReddit(handle));
    }
    if (platforms.includes('npm')) {
      checks.push(this.checkNpm(handle));
    }

    const checkResults = await Promise.allSettled(checks);

    for (const result of checkResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }

    return results;
  }

  /**
   * Check multiple handles across platforms
   */
  async checkMultipleHandles(handles, platforms = ['github', 'twitter', 'instagram']) {
    const results = new Map();

    // Process in batches to avoid overwhelming servers
    for (let i = 0; i < handles.length; i += this.maxConcurrent) {
      const batch = handles.slice(i, i + this.maxConcurrent);

      const batchResults = await Promise.all(
        batch.map(handle => this.checkHandle(handle, platforms))
      );

      batch.forEach((handle, index) => {
        results.set(handle, batchResults[index]);
      });

      // Small delay between batches
      if (i + this.maxConcurrent < handles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Get summary of social handle availability
   */
  getSummary(results) {
    const summary = {
      total: 0,
      available: 0,
      taken: 0,
      unknown: 0,
      byPlatform: {}
    };

    for (const result of results) {
      summary.total++;

      if (result.available === true) {
        summary.available++;
      } else if (result.available === false) {
        summary.taken++;
      } else {
        summary.unknown++;
      }

      if (!summary.byPlatform[result.platform]) {
        summary.byPlatform[result.platform] = {
          available: 0,
          taken: 0,
          unknown: 0
        };
      }

      if (result.available === true) {
        summary.byPlatform[result.platform].available++;
      } else if (result.available === false) {
        summary.byPlatform[result.platform].taken++;
      } else {
        summary.byPlatform[result.platform].unknown++;
      }
    }

    return summary;
  }
}

module.exports = SocialChecker;
