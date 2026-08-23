import { describe, expect, it } from 'vitest';
import { createApp, type AppDeps } from './app';

function makeDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    contact: {
      parseBody: async () => {
        throw new Error('not used in skeleton test');
      },
      rateLimit: async () => true,
      verifyTurnstile: async () => true,
      sendEmail: async () => {},
    },
    activity: {
      fetchActivity: async () => ({ totalContributions: 0, weeks: [] }),
      readCache: async () => undefined,
      writeCache: async () => {},
    },
    ...overrides,
  };
}

describe('createApp error handling', () => {
  it('returns structured json for unknown api routes', async () => {
    const res = await createApp(makeDeps()).request('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ ok: false, error: 'not_found' });
  });
  it('never leaks internal error details', async () => {
    const deps = makeDeps({
      activity: {
        ...makeDeps().activity,
        fetchActivity: async () => {
          throw new Error('super secret upstream url');
        },
        readCache: async () => undefined,
        writeCache: async () => {},
      },
    });
    const res = await createApp(deps).request('/api/activity');
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(body).toMatchObject({ ok: false });
  });
});
