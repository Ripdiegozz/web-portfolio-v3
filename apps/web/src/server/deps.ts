import type { AppDeps, ActivityGrid } from './app';
import { classifyContactPayload, type ClassifiedContact } from './contact/schema';
import { kvRateLimiter, memoryRateLimiter } from './contact/rate-limit';
import { verifyTurnstile } from './contact/turnstile';
import { makeSendContactEmail } from './contact/email';
import { fetchGitHubActivity } from './activity/store';
import type { WorkerBindings } from './types';

const MAX_PER_DAY = 5;
const DAY_SECONDS = 86_400;
const CACHE_MAX_AGE_SECONDS = 3600;

/** Mock mode for Playwright E2E only - hard-disabled in production builds. */
const e2eMocks = import.meta.env.PUBLIC_E2E_MOCKS === '1' && !import.meta.env.PROD;

/**
 * Sole request body reader: classifies the payload and extracts the Turnstile
 * token. Honeypot detection runs before the JSON gate so naive form bots get
 * the fake-success path instead of a 400 that tells them the endpoint
 * validates. Only payloads that clear the honeypot must be strict JSON.
 */
async function parseJsonContactBody(
  request: Request
): Promise<{ classified: ClassifiedContact; turnstileToken: string }> {
  const text = await request.text().catch(() => '');
  let raw: unknown = null;
  if (text) {
    try {
      raw = JSON.parse(text);
    } catch {
      raw = Object.fromEntries(new URLSearchParams(text));
    }
  }
  const { classified: honeypot } = classifyContactPayload(raw);
  if (honeypot.kind === 'silent_bot') {
    return { classified: honeypot, turnstileToken: '' };
  }
  // Require JSON: a JSON content-type forces a CORS preflight, removing the
  // simple-request path used by cross-origin form posts.
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return { classified: { kind: 'rejected' }, turnstileToken: '' };
  }
  return classifyContactPayload(raw);
}

const mockActivityDeps = (): AppDeps['activity'] => ({
  fetchActivity: async () => ({ totalContributions: 0, weeks: [] }),
  readCache: async () => undefined,
  writeCache: async () => {},
});

/**
 * Production activity hooks: GitHub GraphQL upstream plus a Cloudflare edge
 * cache. fetchActivity returns the raw GraphQL payload - createApp composes it
 * with getActivityWithFallback, which maps and caches it.
 */
export function buildActivityDeps(bindings: WorkerBindings): AppDeps['activity'] {
  return {
    fetchActivity: async () => {
      const token = bindings.GITHUB_TOKEN ?? '';
      if (!token) throw new Error('missing_github_token');
      return fetchGitHubActivity(token);
    },
    async readCache() {
      try {
        const { caches } = await import('cloudflare:workers');
        const cache = caches?.default;
        if (!cache) return undefined;
        const cacheReq = new Request('https://dagadev.net/__cache/activity-grid.json');
        const hit = await cache.match(cacheReq);
        if (!hit) return undefined;
        return (await hit.json()) as ActivityGrid;
      } catch {
        return undefined;
      }
    },
    async writeCache(grid) {
      try {
        const { caches } = await import('cloudflare:workers');
        const cache = caches?.default;
        if (!cache) return;
        const cacheReq = new Request('https://dagadev.net/__cache/activity-grid.json');
        await cache.put(
          cacheReq,
          new Response(JSON.stringify(grid), {
            headers: {
              'content-type': 'application/json',
              'cache-control': `public, max-age=${CACHE_MAX_AGE_SECONDS}`,
            },
          })
        );
      } catch {
        // best-effort cache write
      }
    },
  };
}

// Module-scope singleton: created once per Worker isolate, reused for every
// request. Without this, a memoryRateLimiter built per request starts with an
// empty counter map and the rate limit becomes a no-op. Bindings are static
// for the life of the isolate; first sighting wins.
let cachedDeps: AppDeps | null = null;

function createDeps(bindings: WorkerBindings): AppDeps {
  if (e2eMocks) {
    const limiter = memoryRateLimiter(MAX_PER_DAY);
    return {
      contact: {
        parseBody: parseJsonContactBody,
        verifyTurnstile: async () => true,
        rateLimit: async (ip) => limiter.allow(ip ?? 'anon'),
        sendEmail: async () => {},
      },
      activity: mockActivityDeps(),
    };
  }

  const kv = bindings.RATE_LIMIT_KV;
  // NOTE: without the KV namespace wired in wrangler.jsonc, the fallback limiter
  // is per-isolate only; provision RATE_LIMIT_KV before production deploy.
  const limiter = kv
    ? kvRateLimiter(kv, DAY_SECONDS, MAX_PER_DAY)
    : memoryRateLimiter(MAX_PER_DAY);
  const secret = bindings.TURNSTILE_SECRET_KEY ?? '';
  const sendEmail = makeSendContactEmail(bindings.RESEND_API_KEY ?? '');

  return {
    contact: {
      parseBody: parseJsonContactBody,
      verifyTurnstile: (token, ip) => verifyTurnstile(token ?? '', ip, secret),
      rateLimit: (ip) => limiter.allow(ip ?? 'anon'),
      sendEmail: async (input) => {
        const result = await sendEmail(input);
        if (!result.sent) throw new Error('email_delivery_failed');
      },
    },
    // GitHub activity with edge cache: fresh upstream, stale cache, empty grid.
    activity: buildActivityDeps(bindings),
  };
}

export function buildDeps(bindings: WorkerBindings): AppDeps {
  if (!cachedDeps) cachedDeps = createDeps(bindings);
  return cachedDeps;
}
