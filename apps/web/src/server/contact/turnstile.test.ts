import { describe, expect, it, vi } from 'vitest';
import { verifyTurnstile } from './turnstile';

const okResponse = () => new Response(JSON.stringify({ success: true }), { status: 200 });

describe('verifyTurnstile', () => {
  it('posts secret+token to siteverify and accepts success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okResponse());
    expect(await verifyTurnstile('tok', '1.2.3.4', 'sec', fetchImpl)).toBe(true);
    const call = fetchImpl.mock.calls[0]!;
    const [url, init] = call;
    expect(url).toContain('challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(JSON.parse(init.body)).toMatchObject({ secret: 'sec', response: 'tok', remoteip: '1.2.3.4' });
  });
  it('rejects when cloudflare says failure', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 200 }));
    expect(await verifyTurnstile('tok', null, 'sec', fetchImpl)).toBe(false);
  });
  it('fails closed on network errors', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await verifyTurnstile('tok', null, 'sec', fetchImpl)).toBe(false);
  });
});
