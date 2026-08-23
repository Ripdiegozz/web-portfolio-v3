import type { KVLike } from '../types';

export interface RateLimiter {
  allow(clientKey: string): Promise<boolean>;
}

function kvCounterLimiter(kv: KVLike, ttlSeconds: number, max: number): RateLimiter {
  return {
    async allow(clientKey) {
      const key = `rl:${clientKey}`;
      const current = parseInt((await kv.get(key)) ?? '0', 10);
      if (current >= max) return false;
      const next = current + 1;
      // Fixed window: TTL anchored on first increment of the window.
      await kv.put(key, String(next), current === 0 ? { expirationTtl: ttlSeconds } : undefined);
      return next <= max;
    },
  };
}

/**
 * Fixed-window rate limiter against an in-memory store. Used as the fallback
 * when the KV binding is missing and by E2E mocks. Unlike the KV variant, the
 * window is tracked per key with timestamps so counts actually reset.
 */
export function memoryRateLimiter(max: number, ttlMs = 86_400_000): RateLimiter & {
  counts: Map<string, { count: number; expiresAt: number }>;
} {
  const counts = new Map<string, { count: number; expiresAt: number }>();
  return {
    counts,
    async allow(clientKey) {
      const now = Date.now();
      const entry = counts.get(clientKey);
      if (!entry || entry.expiresAt <= now) {
        counts.set(clientKey, { count: 1, expiresAt: now + ttlMs });
        return 1 <= max;
      }
      entry.count += 1;
      return entry.count <= max;
    },
  };
}

export const kvRateLimiter = (kv: KVLike, ttlSeconds: number, max = 2): RateLimiter =>
  kvCounterLimiter(kv, ttlSeconds, max);
