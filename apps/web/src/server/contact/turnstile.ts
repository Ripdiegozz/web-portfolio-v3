export type FetchImpl = typeof fetch;

export async function verifyTurnstile(
  token: string,
  ip: string | null,
  secret: string,
  fetchImpl: FetchImpl = fetch
): Promise<boolean> {
  try {
    const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip ?? undefined }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false; // fail closed
  }
}
