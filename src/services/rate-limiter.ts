/**
 * Sliding window rate limiter per API key.
 * Tracks request timestamps and enforces configurable thresholds.
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

// Store: apiKey -> sorted array of request timestamps (ms)
const requestLog: Map<string, number[]> = new Map();
const keyConfigs: Map<string, RateLimitConfig> = new Map();

const DEFAULT_CONFIG: RateLimitConfig = { maxRequests: 100, windowMs: 60_000 };

/**
 * Configures rate limit for a specific API key.
 */
export function configureRateLimit(apiKey: string, config: RateLimitConfig): void {
  if (config.maxRequests < 1) throw new Error("maxRequests must be at least 1");
  if (config.windowMs < 1) throw new Error("windowMs must be at least 1");
  keyConfigs.set(apiKey, config);
}

/**
 * Checks whether a request from the given API key is allowed
 * under the sliding window rate limit. If allowed, records the request.
 * Returns remaining quota and retry-after hint when blocked.
 */
export function checkRateLimit(apiKey: string, now: number = Date.now()): RateLimitResult {
  const config = keyConfigs.get(apiKey) ?? DEFAULT_CONFIG;
  const windowStart = now - config.windowMs;

  // Get or create the request log for this key
  let timestamps = requestLog.get(apiKey);
  if (!timestamps) {
    timestamps = [];
    requestLog.set(apiKey, timestamps);
  }

  // Prune expired entries outside the window
  const firstValid = timestamps.findIndex((t) => t > windowStart);
  if (firstValid > 0) {
    timestamps.splice(0, firstValid);
  } else if (firstValid === -1 && timestamps.length > 0) {
    timestamps.length = 0;
  }

  const currentCount = timestamps.length;

  if (currentCount >= config.maxRequests) {
    // Blocked — calculate retry-after from the oldest entry in the window
    const oldestInWindow = timestamps[0]!;
    const retryAfterMs = Math.max(0, oldestInWindow + config.windowMs - now);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
    };
  }

  // Allowed — record this request
  timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxRequests - currentCount - 1,
    retryAfterMs: 0,
  };
}

/**
 * Returns the current rate limit config for a key (or default).
 */
export function getRateLimitConfig(apiKey: string): RateLimitConfig {
  return keyConfigs.get(apiKey) ?? DEFAULT_CONFIG;
}

/**
 * Clears all rate limit state. Used for testing.
 */
export function resetRateLimiter(): void {
  requestLog.clear();
  keyConfigs.clear();
}
