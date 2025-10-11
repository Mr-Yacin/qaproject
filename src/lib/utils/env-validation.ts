/**
 * Environment Variable Validation
 * 
 * Validates that all required environment variables are present and properly formatted.
 * Run this at application startup to catch configuration issues early.
 */

interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  validatorMessage?: string;
}

const ENV_VARIABLES: EnvVariable[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
    validator: (value) => value.startsWith('postgresql://'),
    validatorMessage: 'Must be a valid PostgreSQL connection string starting with postgresql://',
  },
  {
    name: 'TEST_DATABASE_URL',
    required: false,
    description: 'Test database connection string (optional, uses DATABASE_URL if not set)',
  },

  // API Security
  {
    name: 'INGEST_API_KEY',
    required: true,
    description: 'Static API key for webhook authentication',
    validator: (value) => value.length >= 32,
    validatorMessage: 'Should be at least 32 characters for security',
  },
  {
    name: 'INGEST_WEBHOOK_SECRET',
    required: true,
    description: 'Secret key for HMAC signature verification',
    validator: (value) => value.length >= 32,
    validatorMessage: 'Should be at least 32 characters for security',
  },

  // NextAuth
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'Secret key for NextAuth.js session encryption',
    validator: (value) => value.length >= 32,
    validatorMessage: 'Should be at least 32 characters for security',
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'Canonical URL of the application',
    validator: (value) => value.startsWith('http://') || value.startsWith('https://'),
    validatorMessage: 'Must be a valid URL starting with http:// or https://',
  },

  // Admin Authentication
  {
    name: 'ADMIN_EMAIL',
    required: true,
    description: 'Default admin user email',
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    validatorMessage: 'Must be a valid email address',
  },
  {
    name: 'ADMIN_PASSWORD',
    required: true,
    description: 'Default admin user password',
    validator: (value) => value.length >= 8,
    validatorMessage: 'Should be at least 8 characters for security',
  },

  // Application
  {
    name: 'NEXT_PUBLIC_API_URL',
    required: true,
    description: 'Base URL for API calls',
    validator: (value) => value.startsWith('http://') || value.startsWith('https://'),
    validatorMessage: 'Must be a valid URL starting with http:// or https://',
  },
];

/**
 * Validate all environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_VARIABLES) {
    const value = process.env[envVar.name];

    // Check if required variable is missing
    if (envVar.required && !value) {
      errors.push(`Missing required environment variable: ${envVar.name} - ${envVar.description}`);
      continue;
    }

    // Skip validation if optional and not set
    if (!envVar.required && !value) {
      continue;
    }

    // Run custom validator if present
    if (value && envVar.validator && !envVar.validator(value)) {
      const message = envVar.validatorMessage || 'Invalid format';
      errors.push(`Invalid ${envVar.name}: ${message}`);
    }
  }

  // Additional security warnings
  if (process.env.NODE_ENV === 'production') {
    // Warn about default/weak passwords
    if (process.env.ADMIN_PASSWORD === 'admin123') {
      warnings.push('SECURITY WARNING: Using default admin password. Change immediately!');
    }

    // Warn about HTTP in production
    if (process.env.NEXTAUTH_URL?.startsWith('http://')) {
      warnings.push('SECURITY WARNING: NEXTAUTH_URL uses HTTP. Use HTTPS in production!');
    }

    if (process.env.NEXT_PUBLIC_API_URL?.startsWith('http://')) {
      warnings.push('SECURITY WARNING: NEXT_PUBLIC_API_URL uses HTTP. Use HTTPS in production!');
    }

    // Warn about short secrets
    const secrets = ['INGEST_API_KEY', 'INGEST_WEBHOOK_SECRET', 'NEXTAUTH_SECRET'];
    for (const secret of secrets) {
      const value = process.env[secret];
      if (value && value.length < 32) {
        warnings.push(`SECURITY WARNING: ${secret} is shorter than recommended 32 characters`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment and throw error if invalid
 * Use this at application startup
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    console.warn('');
  }

  // Throw on errors
  if (!result.valid) {
    console.error('\n❌ Environment Validation Failed:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    console.error('See .env.example for reference.\n');
    throw new Error('Environment validation failed');
  }

  console.log('✅ Environment validation passed');
}

/**
 * Get a list of all environment variables with their status
 * Useful for debugging and documentation
 */
export function getEnvironmentStatus(): Array<{
  name: string;
  required: boolean;
  present: boolean;
  description: string;
}> {
  return ENV_VARIABLES.map((envVar) => ({
    name: envVar.name,
    required: envVar.required,
    present: !!process.env[envVar.name],
    description: envVar.description,
  }));
}

/**
 * Generate a secure random string for secrets
 * Useful for generating API keys and secrets
 */
export async function generateSecret(length: number = 32): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const randomValues = new Uint8Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    // Fallback for Node.js
    const nodeCrypto = await import('crypto');
    return nodeCrypto.randomBytes(length).toString('base64').slice(0, length);
  }
  
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  
  return result;
}
