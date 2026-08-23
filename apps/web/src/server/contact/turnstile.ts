export type FetchImpl = typeof fetch;

export async function verifyTurnstile(
  token: string,
  ip: string | null,
  secret: string,
  fetchImpl: FetchImpl = fetch
): Promise<boolean> {
  // In local development, bypass real Cloudflare Turnstile if dev-token is used
  if (!import.meta.env.PROD && token === 'dev-token') {
    return true;
  }

  if (!secret) {
    console.warn('[turnstile] TURNSTILE_SECRET_KEY is missing or empty. Please set it in your .env');
    return false;
  }
  if (!token) {
    console.warn('[turnstile] No turnstile token received from client');
    return false;
  }
  try {
    const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip ?? undefined }),
    });
    if (!res.ok) {
      console.error(`[turnstile] siteverify returned HTTP ${res.status}`);
      return false;
    }
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!data.success) {
      console.warn('[turnstile] verification rejected by Cloudflare:', data['error-codes']);
    }
    return data.success === true;
  } catch (err) {
    console.error('[turnstile] siteverify network error:', err);
    return false; // fail closed
  }
}
