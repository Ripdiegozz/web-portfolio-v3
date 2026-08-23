import type { AppDeps } from './app';
import { contactSchema, classifyContactAttempt, type ClassifiedContact } from './contact/schema';
import { kvRateLimiter, memoryRateLimiter } from './contact/rate-limit';
import { verifyTurnstile } from './contact/turnstile';
import { makeSendContactEmail } from './contact/email';
import type { WorkerBindings } from './types';

const MAX_PER_DAY = 5;

/** Mock mode for Playwright E2E only — hard-disabled in production builds. */
const e2eMocks = import.meta.env.PUBLIC_E2E_MOCKS === '1' && !import.meta.env.PROD;

/** Sole request body reader: classifies the payload and extracts the Turnstile token. */
async function defaultParseBody(
  request: Request
): Promise<{ classified: ClassifiedContact; turnstileToken: string }> {
  const raw = await request.json().catch(() => null);
  return {
    classified: classifyContactAttempt(contactSchema.safeParse(raw)),
    turnstileToken: (raw as { turnstileToken?: string } | null)?.turnstileToken ?? '',
  };
}

const mockActivityDeps = (): AppDeps['activity'] => ({
  fetchActivity: async () => ({ totalContributions: 0, weeks: [] }),
  readCache: async () => undefined,
  writeCache: async () => {},
});

export function buildDeps(bindings: WorkerBindings): AppDeps {
  if (e2eMocks) {
    const limiter = memoryRateLimiter(MAX_PER_DAY);
    return {
      contact: {
        parseBody: defaultParseBody,
        verifyTurnstile: async () => true,
        rateLimit: async (ip) => limiter.allow(ip ?? 'anon'),
        sendEmail: async () => {},
      },
      activity: mockActivityDeps(),
    };
  }

  const kv = bindings.RATE_LIMIT_KV;
  const limiter = kv
    ? kvRateLimiter(kv, 86_400, MAX_PER_DAY)
    : memoryRateLimiter(MAX_PER_DAY); // degraded-but-working if binding missing
  const secret = bindings.TURNSTILE_SECRET_KEY ?? '';
  const sendEmail = makeSendContactEmail(bindings.RESEND_API_KEY ?? '');

  return {
    contact: {
      parseBody: defaultParseBody,
      verifyTurnstile: (token, ip) => verifyTurnstile(token ?? '', ip, secret),
      rateLimit: (ip) => limiter.allow(ip ?? 'anon'),
      sendEmail: async (input) => {
        const result = await sendEmail(input);
        if (!result.sent) throw new Error('email_delivery_failed');
      },
    },
    // TODO(Task 17): replaced by the GitHub activity fetcher with edge cache.
    activity: mockActivityDeps(),
  };
}
