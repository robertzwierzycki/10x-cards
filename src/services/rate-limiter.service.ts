/**
 * Rate Limiter Service
 * In-memory implementation for rate limiting user requests
 *
 * For production, consider using Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Timestamp in milliseconds
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // Seconds until reset
}

/**
 * In-memory store for rate limit tracking
 * Key format: "ai_gen:{userId}"
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Check if a user has exceeded their rate limit
 *
 * @param userId - UUID of the user
 * @param limit - Maximum number of requests allowed (default: 10)
 * @param windowSeconds - Time window in seconds (default: 60)
 * @returns Rate limit result with allowed status and metadata
 */
export async function checkRateLimit(userId: string, limit = 10, windowSeconds = 60): Promise<RateLimitResult> {
  const key = `ai_gen:${userId}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Get or create entry
  let entry = rateLimitStore.get(key);

  // If entry doesn't exist or has expired, create new one
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    const resetIn = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetIn,
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(key, entry);

  const resetIn = Math.ceil((entry.resetAt - now) / 1000);

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetIn,
  };
}

/**
 * Reset rate limit for a specific user (useful for testing)
 *
 * @param userId - UUID of the user
 */
export function resetRateLimit(userId: string): void {
  const key = `ai_gen:${userId}`;
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status without incrementing
 *
 * @param userId - UUID of the user
 * @param limit - Maximum number of requests allowed
 * @returns Current rate limit status
 */
export function getRateLimitStatus(userId: string, limit = 10): RateLimitResult {
  const key = `ai_gen:${userId}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // If no entry or expired, user has full allowance
  if (!entry || entry.resetAt <= now) {
    return {
      allowed: true,
      remaining: limit,
      resetIn: 0,
    };
  }

  const resetIn = Math.ceil((entry.resetAt - now) / 1000);

  return {
    allowed: entry.count < limit,
    remaining: Math.max(0, limit - entry.count),
    resetIn,
  };
}
