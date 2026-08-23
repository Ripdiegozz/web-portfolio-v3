import { Hono } from 'hono';
import type { ClassifiedContact } from './contact/schema';
import { getActivityWithFallback } from './activity/store';

export interface ContactDeps {
  /** Sole Request reader: returns the classified payload and the Turnstile token. */
  parseBody(request: Request): Promise<{ classified: ClassifiedContact; turnstileToken: string }>;
  verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean>;
  rateLimit(ip: string | null): Promise<boolean>;
  sendEmail(input: { name: string; email: string; message: string }): Promise<void>;
}

export interface ActivityGrid {
  totalContributions: number;
  weeks: Array<{
    days: Array<{ date: string; count: number; level: number }>;
  }>;
}

export interface ActivityDeps {
  /** Raw GitHub GraphQL payload; getActivityWithFallback maps it to ActivityGrid. */
  fetchActivity(): Promise<unknown>;
  readCache(): Promise<ActivityGrid | undefined>;
  writeCache(grid: ActivityGrid): Promise<void>;
}

export interface AppDeps {
  contact: ContactDeps;
  activity: ActivityDeps;
}

export type ApiApp = ReturnType<typeof createApp>;

export function createApp(deps: AppDeps) {
  const app = new Hono();

  app.onError((err, c) => {
    // Non-HTTP OK to log the message here; responses stay generic to clients.
    console.error('[api]', err);
    return c.json({ ok: false, error: 'internal_error' }, 500);
  });
  app.notFound((c) => c.json({ ok: false, error: 'not_found' }, 404));

  app.post('/api/contact', async (c) => {
    const ip = c.req.header('cf-connecting-ip') ?? null;
    const { classified, turnstileToken } = await deps.contact.parseBody(c.req.raw);

    if (classified.kind === 'rejected') {
      return c.json({ ok: false, error: 'invalid_input' }, 400);
    }
    if (classified.kind === 'silent_bot') {
      return c.json({ ok: true }); // lie to bots, do nothing
    }

    if (!(await deps.contact.verifyTurnstile(turnstileToken, ip))) {
      return c.json({ ok: false, error: 'verification_failed' }, 403);
    }
    if (!(await deps.contact.rateLimit(ip))) {
      return c.json({ ok: false, error: 'rate_limited' }, 429);
    }
    try {
      await deps.contact.sendEmail(classified.data);
    } catch {
      return c.json({ ok: false, error: 'delivery_failed' }, 502);
    }
    return c.json({ ok: true });
  });

  app.get('/api/activity', async (c) => {
    // Fresh upstream, else stale cache, else empty grid, always 200. The
    // three hooks on deps.activity compose into the fallback chain here so
    // tests stay hook-based without a test-side run.
    const { grid, source } = await getActivityWithFallback({
      fetchFresh: deps.activity.fetchActivity,
      readCache: deps.activity.readCache,
      writeCache: deps.activity.writeCache,
    });
    return c.json({ ok: true, cached: source !== 'fresh', data: grid });
  });

  return app;
}
