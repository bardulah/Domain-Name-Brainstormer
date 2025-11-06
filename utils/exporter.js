/**
 * Export functionality for domain search results
 * Supports JSON and CSV formats
 */

const fs = require('fs');
const path = require('path');

class Exporter {
  /**
   * Export results to JSON
   */
  static toJSON(results, options = {}) {
    const data = {
      exported_at: new Date().toISOString(),
      summary: options.summary || {},
      results: results.map(r => ({
        domain: r.domain,
        name: r.name || r.domain.split('.')[0],
        tld: r.tld || r.domain.match(/\.[^.]+$/)?.[0],
        available: r.available,
        status: r.status,
        score: r.score,
        scoring: r.scoring,
        social: r.social,
        method: r.method,
        cached: r.cached || false,
        error: r.error
      }))
    };

    if (options.pretty) {
      return JSON.stringify(data, null, 2);
    }

    return JSON.stringify(data);
  }

  /**
   * Export results to CSV
   */
  static toCSV(results, options = {}) {
    const includeScores = options.includeScores !== false;
    const includeSocial = options.includeSocial !== false;

    // Build header
    const headers = ['Domain', 'Available', 'Status'];

    if (includeScores) {
      headers.push('Overall Score', 'Grade', 'Pronounceability', 'Length', 'Brandability');
    }

    if (includeSocial) {
      headers.push('GitHub', 'Twitter', 'Instagram');
    }

    headers.push('Method', 'Cached');

    const rows = [headers];

    // Build rows
    for (const result of results) {
      const row = [
        result.domain,
        result.available === true ? 'Yes' :
        result.available === false ? 'No' : 'Unknown',
        result.status || 'unknown'
      ];

      if (includeScores && result.scoring) {
        row.push(
          result.scoring.overall || 'N/A',
          result.scoring.grade || 'N/A',
          result.scoring.breakdown?.pronounceability || 'N/A',
          result.scoring.breakdown?.length || 'N/A',
          result.scoring.breakdown?.brandability || 'N/A'
        );
      } else if (includeScores) {
        row.push('N/A', 'N/A', 'N/A', 'N/A', 'N/A');
      }

      if (includeSocial && result.social) {
        const github = result.social.find(s => s.platform === 'GitHub');
        const twitter = result.social.find(s => s.platform === 'Twitter/X');
        const instagram = result.social.find(s => s.platform === 'Instagram');

        row.push(
          github?.available === true ? 'Available' :
          github?.available === false ? 'Taken' : 'Unknown',

          twitter?.available === true ? 'Available' :
          twitter?.available === false ? 'Taken' : 'Check Manually',

          instagram?.available === true ? 'Available' :
          instagram?.available === false ? 'Taken' : 'Unknown'
        );
      } else if (includeSocial) {
        row.push('N/A', 'N/A', 'N/A');
      }

      row.push(result.method || 'N/A', result.cached ? 'Yes' : 'No');

      rows.push(row);
    }

    // Convert to CSV string
    return rows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
  }

  /**
   * Save results to file
   */
  static async saveToFile(results, filename, options = {}) {
    const ext = path.extname(filename).toLowerCase();
    let content;

    if (ext === '.json') {
      content = this.toJSON(results, { ...options, pretty: true });
    } else if (ext === '.csv') {
      content = this.toCSV(results, options);
    } else {
      throw new Error(`Unsupported file format: ${ext}. Use .json or .csv`);
    }

    // Ensure output directory exists
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filename, content, 'utf8');

    return {
      filename,
      format: ext.replace('.', ''),
      size: content.length,
      count: results.length
    };
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(prefix = 'domains', format = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}-${timestamp}.${format}`;
  }

  /**
   * Export to multiple formats
   */
  static async saveToMultipleFormats(results, directory, prefix = 'domains', options = {}) {
    const formats = ['json', 'csv'];
    const savedFiles = [];

    for (const format of formats) {
      const filename = path.join(directory, this.generateFilename(prefix, format));
      const result = await this.saveToFile(results, filename, options);
      savedFiles.push(result);
    }

    return savedFiles;
  }

  /**
   * Create markdown report
   */
  static toMarkdown(results, summary = {}) {
    const lines = [];

    lines.push('# Domain Search Results\n');
    lines.push(`**Generated:** ${new Date().toISOString()}\n`);

    if (summary.total) {
      lines.push('## Summary\n');
      lines.push(`- **Total Checked:** ${summary.total}`);
      lines.push(`- **Available:** ${summary.available}`);
      lines.push(`- **Registered:** ${summary.registered}`);
      lines.push(`- **Unknown:** ${summary.unknown}\n`);
    }

    // Available domains
    const available = results.filter(r => r.available === true);
    if (available.length > 0) {
      lines.push('## Available Domains\n');
      lines.push('| Domain | Score | Grade | GitHub | Instagram |');
      lines.push('|--------|-------|-------|--------|-----------|');

      for (const result of available.slice(0, 50)) {
        const score = result.scoring?.overall || 'N/A';
        const grade = result.scoring?.grade || 'N/A';
        const github = result.social?.find(s => s.platform === 'GitHub');
        const instagram = result.social?.find(s => s.platform === 'Instagram');

        lines.push(`| ${result.domain} | ${score} | ${grade} | ${
          github?.available === true ? '✓' :
          github?.available === false ? '✗' : '?'
        } | ${
          instagram?.available === true ? '✓' :
          instagram?.available === false ? '✗' : '?'
        } |`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Save markdown report
   */
  static async saveMarkdown(results, filename, summary = {}) {
    const content = this.toMarkdown(results, summary);
    fs.writeFileSync(filename, content, 'utf8');

    return {
      filename,
      format: 'md',
      size: content.length,
      count: results.length
    };
  }
}

module.exports = Exporter;
