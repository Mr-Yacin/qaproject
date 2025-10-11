/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for rate limiting
 * Requirements: 7.2 - Rate limiting for authentication and file upload endpoints
 */

interface RateLimitStore {
  tokens: number;
  lastRefill: number;
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitStore>();

export interface RateLimitConfig {
  maxRequests: number; // Maximum number of requests
  windowMs: number; // Time window in milliseconds
  keyGenerator?: (identifier: string) => string; // Custom key generator
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints: 5 requests per 15 minutes
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // File upload endpoints: 10 requests per minute
  UPLOAD: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // General API endpoints: 100 requests per minute
  API: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Strict rate limit for sensitive operations: 3 requests per 5 minutes
  STRICT: {
    maxRequests: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
};

/**
 * Rate limit error
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number // seconds until next request allowed
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: Request): string {
  // Try to get IP address from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // Use the first available IP
  const ip = forwardedFor?.split(',')[0].trim() || realIp || cfConnectingIp || 'unknown';
  
  return ip;
}

/**
 * Token bucket rate limiter
 * Refills tokens at a constant rate
 */
function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier;
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  
  if (!entry) {
    entry = {
      tokens: config.maxRequests,
      lastRefill: now,
    };
    rateLimitStore.set(key, entry);
  }
  
  // Calculate tokens to add based on time elapsed
  const timeSinceLastRefill = now - entry.lastRefill;
  const refillRate = config.maxRequests / config.windowMs;
  const tokensToAdd = timeSinceLastRefill * refillRate;
  
  // Refill tokens (up to max)
  entry.tokens = Math.min(config.maxRequests, entry.tokens + tokensToAdd);
  entry.lastRefill = now;
  
  // Check if request is allowed
  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    return { allowed: true, retryAfter: 0 };
  }
  
  // Calculate retry after time
  const tokensNeeded = 1 - entry.tokens;
  const retryAfterMs = tokensNeeded / refillRate;
  const retryAfter = Math.ceil(retryAfterMs / 1000);
  
  return { allowed: false, retryAfter };
}

/**
 * Rate limit middleware
 * Usage: await rateLimit(request, RATE_LIMIT_CONFIGS.AUTH);
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<void> {
  const identifier = getClientIdentifier(request);
  const { allowed, retryAfter } = checkRateLimit(identifier, config);
  
  if (!allowed) {
    throw new RateLimitError(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter
    );
  }
}

/**
 * Cleanup old entries from rate limit store
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastRefill > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 60 * 60 * 1000);
}
