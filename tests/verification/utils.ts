/**
 * Utility functions for verification tests
 */

export class ValidationUtils {
  /**
   * Check if a value is a valid URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a string contains HTML tags
   */
  static containsHtml(text: string): boolean {
    const htmlRegex = /<[^>]+>/;
    return htmlRegex.test(text);
  }

  /**
   * Normalize whitespace in a string
   */
  static normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Check if two objects are deeply equal
   */
  static deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
    
    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) return false;
      return obj1.every((item, index) => this.deepEqual(item, obj2[index]));
    }
    
    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) return false;
      
      return keys1.every(key => 
        keys2.includes(key) && this.deepEqual(obj1[key], obj2[key])
      );
    }
    
    return obj1 === obj2;
  }

  /**
   * Get environment variable with fallback
   */
  static getEnvVar(name: string, fallback?: string): string {
    const value = process.env[name];
    if (value === undefined) {
      if (fallback !== undefined) {
        return fallback;
      }
      throw new Error(`Environment variable ${name} is required`);
    }
    return value;
  }

  /**
   * Create a delay for testing purposes
   */
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a random string for test data
   */
  static randomString(length: number = 10): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Sanitize string for use in test names
   */
  static sanitizeTestName(name: string): string {
    return name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
  }
}

/**
 * Test configuration utilities
 */
export class TestConfigUtils {
  /**
   * Get API base URL from environment
   */
  static getApiBaseUrl(): string {
    return ValidationUtils.getEnvVar('API_BASE_URL', 'http://localhost:3000');
  }

  /**
   * Get test credentials from environment
   */
  static getTestCredentials(): { apiKey: string; webhookSecret: string } {
    return {
      apiKey: ValidationUtils.getEnvVar('TEST_API_KEY', 'test-api-key'),
      webhookSecret: ValidationUtils.getEnvVar('TEST_WEBHOOK_SECRET', 'test-webhook-secret')
    };
  }

  /**
   * Check if we're in test environment
   */
  static isTestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  }

  /**
   * Get test timeout from environment
   */
  static getTestTimeout(): number {
    const timeout = process.env.TEST_TIMEOUT;
    return timeout ? parseInt(timeout, 10) : 30000; // 30 seconds default
  }
}