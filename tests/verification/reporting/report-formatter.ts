/**
 * Report Formatter
 * 
 * Formats verification reports into different output formats including
 * JSON, HTML, and console output with proper styling and structure.
 */

import { VerificationReport, TestStatus, TestCategory } from '../types/index';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export class ReportFormatter {
  /**
   * Format report as JSON
   */
  formatAsJSON(report: VerificationReport, pretty: boolean = true): string {
    return JSON.stringify(report, null, pretty ? 2 : 0);
  }

  /**
   * Format report as HTML
   */
  formatAsHTML(report: VerificationReport): string {
    const statusColor = this.getStatusColor(report.summary.overallStatus);
    const timestamp = report.timestamp.toLocaleString();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Verification Report - ${timestamp}</title>
    <style>
        ${this.getHTMLStyles()}
    </style>
</head>
<body>
    <div class="container">
        <header class="report-header">
            <h1>API Verification Report</h1>
            <div class="report-meta">
                <span class="timestamp">Generated: ${timestamp}</span>
                <span class="environment">Environment: ${report.environment}</span>
                <span class="status status-${report.summary.overallStatus.toLowerCase()}">${report.summary.overallStatus}</span>
            </div>
        </header>

        <section class="summary">
            <h2>Executive Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Total Tests</h3>
                    <div class="metric">${report.summary.totalTests}</div>
                </div>
                <div class="summary-card passed">
                    <h3>Passed</h3>
                    <div class="metric">${report.summary.passedTests}</div>
                </div>
                <div class="summary-card failed">
                    <h3>Failed</h3>
                    <div class="metric">${report.summary.failedTests}</div>
                </div>
                <div class="summary-card skipped">
                    <h3>Skipped</h3>
                    <div class="metric">${report.summary.skippedTests}</div>
                </div>
                <div class="summary-card">
                    <h3>Execution Time</h3>
                    <div class="metric">${this.formatDuration(report.summary.executionTime)}</div>
                </div>
            </div>
        </section>

        ${this.formatCriticalIssuesHTML(report)}
        ${this.formatCategoryResultsHTML(report)}
        ${this.formatPerformanceSummaryHTML(report)}
        ${this.formatRecommendationsHTML(report)}
        ${this.formatDetailedSectionsHTML(report)}
    </div>
</body>
</html>`;
  }

  /**
   * Format report for console output
   */
  formatForConsole(report: VerificationReport): string {
    const lines: string[] = [];
    
    // Header
    lines.push('');
    lines.push('═'.repeat(80));
    lines.push('                    API VERIFICATION REPORT');
    lines.push('═'.repeat(80));
    lines.push(`Generated: ${report.timestamp.toLocaleString()}`);
    lines.push(`Environment: ${report.environment}`);
    lines.push(`Schema Version: ${report.schemaVersion}`);
    lines.push('');

    // Summary
    lines.push('SUMMARY');
    lines.push('─'.repeat(40));
    lines.push(`Overall Status: ${this.colorizeStatus(report.summary.overallStatus)}`);
    lines.push(`Total Tests: ${report.summary.totalTests}`);
    lines.push(`✓ Passed: ${this.colorize(report.summary.passedTests.toString(), 'green')}`);
    lines.push(`✗ Failed: ${this.colorize(report.summary.failedTests.toString(), 'red')}`);
    lines.push(`⊘ Skipped: ${this.colorize(report.summary.skippedTests.toString(), 'yellow')}`);
    lines.push(`⚠ Warnings: ${this.colorize(report.summary.warningTests.toString(), 'yellow')}`);
    lines.push(`Execution Time: ${this.formatDuration(report.summary.executionTime)}`);
    lines.push('');

    // Critical Issues
    if (report.criticalIssues.length > 0) {
      lines.push('CRITICAL ISSUES');
      lines.push('─'.repeat(40));
      for (const issue of report.criticalIssues) {
        lines.push(`🚨 ${this.colorize(issue.title, 'red')}`);
        lines.push(`   ${issue.description}`);
        lines.push(`   Action: ${issue.immediateAction}`);
        if (issue.rollbackRequired) {
          lines.push(`   ${this.colorize('⚠ ROLLBACK REQUIRED', 'red')}`);
        }
        lines.push('');
      }
    }

    // Category Results
    lines.push('CATEGORY RESULTS');
    lines.push('─'.repeat(40));
    for (const [category, result] of Object.entries(report.summary.categoryResults)) {
      const statusIcon = this.getStatusIcon(result.status);
      const categoryName = this.formatCategoryName(category as TestCategory);
      lines.push(`${statusIcon} ${categoryName}: ${result.passedTests}/${result.totalTests} passed`);
    }
    lines.push('');

    // Performance Summary
    if (report.summary.performanceSummary.averageResponseTime > 0) {
      lines.push('PERFORMANCE SUMMARY');
      lines.push('─'.repeat(40));
      lines.push(`Average Response Time: ${report.summary.performanceSummary.averageResponseTime.toFixed(2)}ms`);
      lines.push(`95th Percentile: ${report.summary.performanceSummary.p95ResponseTime.toFixed(2)}ms`);
      lines.push(`99th Percentile: ${report.summary.performanceSummary.p99ResponseTime.toFixed(2)}ms`);
      lines.push(`Cache Effectiveness: ${(report.summary.performanceSummary.cacheEffectiveness * 100).toFixed(1)}%`);
      lines.push('');
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push('RECOMMENDATIONS');
      lines.push('─'.repeat(40));
      for (const rec of report.recommendations) {
        const priorityIcon = this.getPriorityIcon(rec.priority);
        lines.push(`${priorityIcon} ${rec.title} (${rec.estimatedEffort})`);
        lines.push(`   ${rec.description}`);
        for (const action of rec.actionItems) {
          lines.push(`   • ${action}`);
        }
        lines.push('');
      }
    }

    lines.push('═'.repeat(80));
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Save report to file
   */
  saveReport(
    report: VerificationReport, 
    outputPath: string, 
    format: 'json' | 'html' | 'txt' = 'json'
  ): void {
    // Ensure directory exists
    mkdirSync(dirname(outputPath), { recursive: true });

    let content: string;
    switch (format) {
      case 'html':
        content = this.formatAsHTML(report);
        break;
      case 'txt':
        content = this.formatForConsole(report);
        break;
      case 'json':
      default:
        content = this.formatAsJSON(report);
        break;
    }

    writeFileSync(outputPath, content, 'utf8');
  }

  /**
   * Generate summary statistics text
   */
  generateSummaryText(report: VerificationReport): string {
    const { summary } = report;
    const successRate = summary.totalTests > 0 
      ? ((summary.passedTests / summary.totalTests) * 100).toFixed(1)
      : '0';

    return `Verification completed with ${summary.passedTests}/${summary.totalTests} tests passing (${successRate}% success rate). ` +
           `${summary.failedTests} failures, ${summary.skippedTests} skipped. ` +
           `Execution time: ${this.formatDuration(summary.executionTime)}.`;
  }

  /**
   * Get HTML styles
   */
  private getHTMLStyles(): string {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .report-header { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .report-header h1 { color: #2c3e50; margin-bottom: 15px; }
        .report-meta { display: flex; gap: 20px; flex-wrap: wrap; }
        .report-meta span { padding: 5px 12px; background: #ecf0f1; border-radius: 4px; font-size: 14px; }
        .status { font-weight: bold; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .status-warning { background: #fff3cd; color: #856404; }
        .summary { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .summary h2 { margin-bottom: 20px; color: #2c3e50; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .summary-card { text-align: center; padding: 20px; border-radius: 6px; background: #f8f9fa; }
        .summary-card.passed { background: #d4edda; }
        .summary-card.failed { background: #f8d7da; }
        .summary-card.skipped { background: #fff3cd; }
        .summary-card h3 { font-size: 14px; color: #666; margin-bottom: 10px; }
        .metric { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .section { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .section h2 { margin-bottom: 20px; color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; }
        .critical-issue { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
        .critical-issue h4 { color: #721c24; margin-bottom: 10px; }
        .recommendation { background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
        .recommendation h4 { color: #004085; margin-bottom: 10px; }
        .recommendation ul { margin-left: 20px; }
        .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .category-card { background: #f8f9fa; padding: 20px; border-radius: 6px; }
        .category-card h4 { margin-bottom: 15px; color: #2c3e50; }
        .progress-bar { background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: #28a745; transition: width 0.3s ease; }
        .progress-fill.warning { background: #ffc107; }
        .progress-fill.danger { background: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: 600; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
    `;
  }

  /**
   * Format critical issues as HTML
   */
  private formatCriticalIssuesHTML(report: VerificationReport): string {
    if (report.criticalIssues.length === 0) return '';

    const issuesHTML = report.criticalIssues.map(issue => `
        <div class="critical-issue">
            <h4>🚨 ${issue.title}</h4>
            <p><strong>Description:</strong> ${issue.description}</p>
            <p><strong>Impact:</strong> ${issue.impact}</p>
            <p><strong>Immediate Action:</strong> ${issue.immediateAction}</p>
            ${issue.rollbackRequired ? '<p><strong>⚠️ ROLLBACK REQUIRED</strong></p>' : ''}
        </div>
    `).join('');

    return `
        <section class="section">
            <h2>🚨 Critical Issues</h2>
            ${issuesHTML}
        </section>
    `;
  }

  /**
   * Format category results as HTML
   */
  private formatCategoryResultsHTML(report: VerificationReport): string {
    const categoriesHTML = Object.entries(report.summary.categoryResults).map(([category, result]) => {
      const successRate = result.totalTests > 0 ? (result.passedTests / result.totalTests) * 100 : 0;
      const progressClass = successRate === 100 ? '' : successRate >= 80 ? 'warning' : 'danger';
      
      return `
        <div class="category-card">
            <h4>${this.formatCategoryName(category as TestCategory)}</h4>
            <p>${result.passedTests}/${result.totalTests} tests passed</p>
            <div class="progress-bar">
                <div class="progress-fill ${progressClass}" style="width: ${successRate}%"></div>
            </div>
            <small>Average execution time: ${this.formatDuration(result.averageExecutionTime)}</small>
        </div>
      `;
    }).join('');

    return `
        <section class="section">
            <h2>Category Results</h2>
            <div class="category-grid">
                ${categoriesHTML}
            </div>
        </section>
    `;
  }

  /**
   * Format performance summary as HTML
   */
  private formatPerformanceSummaryHTML(report: VerificationReport): string {
    const perf = report.summary.performanceSummary;
    
    if (perf.averageResponseTime === 0) return '';

    return `
        <section class="section">
            <h2>Performance Summary</h2>
            <table>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Average Response Time</td><td>${perf.averageResponseTime.toFixed(2)}ms</td></tr>
                <tr><td>95th Percentile</td><td>${perf.p95ResponseTime.toFixed(2)}ms</td></tr>
                <tr><td>99th Percentile</td><td>${perf.p99ResponseTime.toFixed(2)}ms</td></tr>
                <tr><td>Slowest Endpoint</td><td>${perf.slowestEndpoint}</td></tr>
                <tr><td>Fastest Endpoint</td><td>${perf.fastestEndpoint}</td></tr>
                <tr><td>Cache Effectiveness</td><td>${(perf.cacheEffectiveness * 100).toFixed(1)}%</td></tr>
            </table>
        </section>
    `;
  }

  /**
   * Format recommendations as HTML
   */
  private formatRecommendationsHTML(report: VerificationReport): string {
    if (report.recommendations.length === 0) return '';

    const recommendationsHTML = report.recommendations.map(rec => {
      const priorityBadge = this.getPriorityBadge(rec.priority);
      const actionsHTML = rec.actionItems.map(action => `<li>${action}</li>`).join('');
      
      return `
        <div class="recommendation">
            <h4>${rec.title} ${priorityBadge}</h4>
            <p>${rec.description}</p>
            <p><strong>Estimated Effort:</strong> ${rec.estimatedEffort}</p>
            <ul>${actionsHTML}</ul>
        </div>
      `;
    }).join('');

    return `
        <section class="section">
            <h2>Recommendations</h2>
            ${recommendationsHTML}
        </section>
    `;
  }

  /**
   * Format detailed sections as HTML
   */
  private formatDetailedSectionsHTML(report: VerificationReport): string {
    // This would include detailed breakdowns of each section
    // For brevity, returning a placeholder
    return `
        <section class="section">
            <h2>Detailed Results</h2>
            <p>Detailed test results are available in the JSON export.</p>
        </section>
    `;
  }

  /**
   * Get status color for CSS
   */
  private getStatusColor(status: TestStatus): string {
    switch (status) {
      case TestStatus.PASSED: return '#28a745';
      case TestStatus.FAILED: return '#dc3545';
      case TestStatus.WARNING: return '#ffc107';
      default: return '#6c757d';
    }
  }

  /**
   * Colorize text for console output
   */
  private colorize(text: string, color: 'red' | 'green' | 'yellow' | 'blue' | 'cyan'): string {
    const colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m'
    };
    const reset = '\x1b[0m';
    return `${colors[color]}${text}${reset}`;
  }

  /**
   * Colorize status for console
   */
  private colorizeStatus(status: TestStatus): string {
    switch (status) {
      case TestStatus.PASSED: return this.colorize(status, 'green');
      case TestStatus.FAILED: return this.colorize(status, 'red');
      case TestStatus.WARNING: return this.colorize(status, 'yellow');
      default: return status;
    }
  }

  /**
   * Get status icon for console
   */
  private getStatusIcon(status: TestStatus): string {
    switch (status) {
      case TestStatus.PASSED: return '✓';
      case TestStatus.FAILED: return '✗';
      case TestStatus.WARNING: return '⚠';
      case TestStatus.SKIPPED: return '⊘';
      default: return '?';
    }
  }

  /**
   * Get priority icon for console
   */
  private getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return 'ℹ️';
      case 'low': return '💡';
      default: return '•';
    }
  }

  /**
   * Get priority badge for HTML
   */
  private getPriorityBadge(priority: string): string {
    const badgeClass = {
      critical: 'badge-danger',
      high: 'badge-warning',
      medium: 'badge-info',
      low: 'badge-info'
    }[priority] || 'badge-info';

    return `<span class="badge ${badgeClass}">${priority.toUpperCase()}</span>`;
  }

  /**
   * Format category name for display
   */
  private formatCategoryName(category: TestCategory): string {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }
}