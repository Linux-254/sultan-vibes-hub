const hits = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Fixed-window rate limiter (in-memory, per-isolate).
 * @param key       Unique key (e.g. IP + route)
 * @param limit     Max requests per window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  entry.count++;

  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

// Periodic cleanup every 60s to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now > entry.resetAt) hits.delete(key);
    }
  }, 60_000);
}

/**
 * Preset rate limits for different route categories.
 */
export const LIMITS = {
  /** Auth endpoints (signup, signin, password reset) */
  auth: { limit: 5, windowMs: 60_000 },
  /** SOS alert submission */
  sos: { limit: 3, windowMs: 60_000 },
  /** Chat message sending */
  chat: { limit: 30, windowMs: 60_000 },
  /** General API endpoints */
  api: { limit: 60, windowMs: 60_000 },
  /** Password reset request */
  passwordReset: { limit: 3, windowMs: 300_000 },
} as const;
