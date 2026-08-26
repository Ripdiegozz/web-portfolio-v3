import { describe, expect, it, vi } from 'vitest';
import { createApp, type AppDeps } from './app';

const activityDefaults = (): AppDeps['activity'] => ({
  fetchActivity: async () => ({ totalContributions: 0, weeks: [] }),
  readCache: async () => undefined,
  writeCache: async () => {},
});

const contactDefaults = (): AppDeps['contact'] => ({
  parseBody: async () => ({ classified: { kind: 'rejected' }, turnstileToken: '' }),
  verifyTurnstile: async () => true,
  rateLimit: async () => true,
  sendEmail: async () => {},
});

function makeDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    contact: contactDefaults(),
    activity: activityDefaults(),
    ...overrides,
  };
}

const accepted = {
  name: 'Jane',
  email: 'jane@example.com',
  message: 'Hello there friend',
};

describe('createApp error handling', () => {
  it('returns structured json for unknown api routes', async () => {
    const res = await createApp(makeDeps()).request('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ ok: false, error: 'not_found' });
  });
});

describe('GET /api/activity', () => {
  it('serves mapped fresh data as not cached', async () => {
    const deps = makeDeps({
      activity: {
        ...activityDefaults(),
        fetchActivity: async () => ({
          data: {
            viewer: {
              contributionsCollection: {
                totalContributions: 7,
                contributionCalendar: { weeks: [] },
              },
            },
          },
        }),
      },
    });
    const res = await createApp(deps).request('/api/activity');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, cached: false, data: { totalContributions: 7, weeks: [] } });
  });

  it('serves stale fallback instead of crashing when upstream fails', async () => {
    const deps = makeDeps({
      activity: {
        ...activityDefaults(),
        fetchActivity: async () => {
          throw new Error('super secret upstream url');
        },
      },
    });
    const res = await createApp(deps).request('/api/activity');
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(body).toMatchObject({ ok: true, cached: true });
    expect(body.data).toEqual({ totalContributions: 0, weeks: [] });
  });

  it('serves the stale cache entry when upstream fails', async () => {
    const deps = makeDeps({
      activity: {
        ...activityDefaults(),
        fetchActivity: async () => {
          throw new Error('upstream down');
        },
        readCache: async () => ({ totalContributions: 42, weeks: [] }),
      },
    });
    const res = await createApp(deps).request('/api/activity');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, cached: true, data: { totalContributions: 42, weeks: [] } });
  });

  it('still serves empty fallback when the cache read itself fails', async () => {
    const deps = makeDeps({
      activity: {
        ...activityDefaults(),
        fetchActivity: async () => {
          throw new Error('upstream down');
        },
        readCache: async () => {
          throw new Error('cache boom');
        },
      },
    });
    const res = await createApp(deps).request('/api/activity');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, cached: true, data: { totalContributions: 0, weeks: [] } });
  });
});

describe('POST /api/contact', () => {
  const post = (deps: AppDeps, body: unknown) =>
    createApp(deps).request('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('rejects payloads the schema classifies as invalid', async () => {
    const res = await post(makeDeps(), { name: '', email: 'not-an-email', message: 'short' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'invalid_input' });
  });

  it('pretends success to honeypot bots without sending email', async () => {
    const sendEmail = vi.fn(async () => {});
    const deps = makeDeps({
      contact: {
        ...contactDefaults(),
        parseBody: async () => ({ classified: { kind: 'silent_bot' }, turnstileToken: '' }),
        sendEmail,
      },
    });
    const res = await post(deps, {});
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 403 when turnstile verification fails', async () => {
    const deps = makeDeps({
      contact: {
        ...contactDefaults(),
        parseBody: async () => ({ classified: { kind: 'accepted', data: accepted }, turnstileToken: 'bad' }),
        verifyTurnstile: async () => false,
      },
    });
    const res = await post(deps, {});
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ ok: false, error: 'verification_failed' });
  });

  it('returns 429 when rate limited', async () => {
    const deps = makeDeps({
      contact: {
        ...contactDefaults(),
        parseBody: async () => ({ classified: { kind: 'accepted', data: accepted }, turnstileToken: 't' }),
        rateLimit: async () => false,
      },
    });
    const res = await post(deps, {});
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ ok: false, error: 'rate_limited' });
  });

  it('returns 502 when email delivery fails', async () => {
    const deps = makeDeps({
      contact: {
        ...contactDefaults(),
        parseBody: async () => ({ classified: { kind: 'accepted', data: accepted }, turnstileToken: 't' }),
        sendEmail: async () => {
          throw new Error('delivery boom');
        },
      },
    });
    const res = await post(deps, {});
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, error: 'delivery_failed' });
  });

  it('delivers a valid message and returns ok', async () => {
    const sendEmail = vi.fn(async () => {});
    const deps = makeDeps({
      contact: {
        ...contactDefaults(),
        parseBody: async () => ({ classified: { kind: 'accepted', data: accepted }, turnstileToken: 't' }),
        sendEmail,
      },
    });
    const res = await post(deps, { name: accepted.name, email: accepted.email, message: accepted.message, turnstileToken: 't' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sendEmail).toHaveBeenCalledWith(accepted);
  });
});

describe('POST /api/chat', () => {
  it('returns 400 on invalid json', async () => {
    const app = createApp(makeDeps());
    const res = await app.request('/api/chat', {
      method: 'POST',
      body: 'invalid-json',
      headers: { 'content-type': 'application/json' },
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'invalid_json' });
  });

  it('returns 400 when payload has empty messages', async () => {
    const app = createApp(makeDeps());
    const res = await app.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
      headers: { 'content-type': 'application/json' },
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'invalid_payload' });
  });

  it('enforces chat rate limiting with 429 status', async () => {
    const deps = makeDeps({
      chat: {
        processMessage: async () => 'Hello',
        rateLimit: async () => false,
      },
    });
    const app = createApp(deps);
    const res = await app.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
      headers: { 'content-type': 'application/json' },
    });
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ ok: false, error: 'rate_limited' });
  });

  it('processes chat message and returns reply', async () => {
    const processMessage = vi.fn(async () => 'Diego is a Full-Stack Engineer at Wazuh.');
    const deps = makeDeps({
      chat: {
        processMessage,
        rateLimit: async () => true,
      },
    });
    const app = createApp(deps);
    const res = await app.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        locale: 'en',
        messages: [{ role: 'user', content: 'What does Diego do at Wazuh?' }],
      }),
      headers: { 'content-type': 'application/json' },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      reply: 'Diego is a Full-Stack Engineer at Wazuh.',
    });
    expect(processMessage).toHaveBeenCalled();
  });
});
