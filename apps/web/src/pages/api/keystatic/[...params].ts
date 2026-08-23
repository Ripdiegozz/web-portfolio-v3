export const prerender = false;
import type { APIRoute } from 'astro';
import { makeGenericAPIRouteHandler } from '@keystatic/core/api/generic';
import type { KeystaticApiEnv } from '../../../server/env';
import config from '../../../../keystatic.config';

async function resolveEnv(locals: unknown): Promise<KeystaticApiEnv> {
  // Astro v6 REMOVED locals.runtime.env: the adapter installs a getter that
  // throws on access. The canonical source is now cloudflare:workers; keep the
  // legacy path only as a fallback for older adapters.
  try {
    const mod = await import('cloudflare:workers');
    return mod.env as unknown as KeystaticApiEnv;
  } catch (err) {
    // The import may fail in plain-node dev; log it so prod failures are never
    // silently blamed on missing env vars downstream.
    console.warn('[keystatic] cloudflare:workers env unavailable; falling back', err);
    const runtimeEnv = (locals as { runtime?: { env?: KeystaticApiEnv } })?.runtime?.env;
    return runtimeEnv ?? {};
  }
}

export const GET: APIRoute = async ({ request, locals }) => {
  const env = await resolveEnv(locals);
  // Conditional spreads keep exactOptionalPropertyTypes happy: optional keys
  // must never be explicitly set to undefined.
  const handler = makeGenericAPIRouteHandler(
    {
      config,
      ...(env.KEYSTATIC_GITHUB_CLIENT_ID ? { clientId: env.KEYSTATIC_GITHUB_CLIENT_ID } : {}),
      ...(env.KEYSTATIC_GITHUB_CLIENT_SECRET
        ? { clientSecret: env.KEYSTATIC_GITHUB_CLIENT_SECRET }
        : {}),
      ...(env.KEYSTATIC_SECRET ? { secret: env.KEYSTATIC_SECRET } : {}),
    },
    { slugEnvName: 'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG' }
  );
  // KeystaticRequest contract (0.6.x): headers with .get(), method, url, json().
  const keystatic = await handler({
    method: request.method,
    headers: request.headers,
    url: request.url,
    json: () => request.json(),
  });
  // Uint8Array bodies are valid BodyInit at runtime; the double width
  // (ArrayBufferLike) of newer lib typings forces this single boundary cast.
  return new Response(keystatic.body as BodyInit | null, {
    ...(keystatic.status !== undefined ? { status: keystatic.status } : {}),
    ...(keystatic.headers ? { headers: keystatic.headers } : {}),
  });
};

export const POST = GET;
