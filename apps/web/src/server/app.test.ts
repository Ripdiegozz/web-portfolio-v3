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
  it('never leaks internal error details', async () => {
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
    expect(res.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(body).toMatchObject({ ok: false });
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
