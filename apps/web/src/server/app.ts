import { Hono } from 'hono';

export interface ContactDeps {
  parseBody(request: Request): Promise<{ name: string; email: string; message: string; bot: boolean }>;
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
    // Real pipeline lands in Task 15.
    return c.json({ ok: false, error: 'not_implemented' }, 501);
  });

  app.get('/api/activity', async (c) => {
    // No-cache baseline; edge caching lands in Task 16.
    const grid = await deps.activity.fetchActivity();
    return c.json({ ok: true, grid });
  });

  return app;
}
