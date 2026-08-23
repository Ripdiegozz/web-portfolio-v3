import { Hono } from 'hono';
import type { ClassifiedContact } from './contact/schema';

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
  fetchActivity(): Promise<ActivityGrid>;
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

  app.onError(() => Response.json({ ok: false, error: 'internal_error' }, { status: 500 }));
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
    // No-cache baseline; edge caching lands in Task 16.
    const grid = await deps.activity.fetchActivity();
    return c.json({ ok: true, grid });
  });

  return app;
}
