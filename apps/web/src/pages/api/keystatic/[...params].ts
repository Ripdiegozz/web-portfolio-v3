export const prerender = false;
import type { APIRoute } from 'astro';
import { makeGenericAPIRouteHandler } from '@keystatic/core/api/generic';
import { getWorkerEnv } from '../../../server/env';
import config from '../../../../keystatic.config';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const env = await getWorkerEnv(locals);
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
      json: async () => {
        try {
          return await request.json();
        } catch {
          return null;
        }
      },
    });
    // Uint8Array bodies are valid BodyInit at runtime; the double width
    // (ArrayBufferLike) of newer lib typings forces this single boundary cast.
    return new Response(keystatic.body as BodyInit | null, {
      ...(keystatic.status !== undefined ? { status: keystatic.status } : {}),
      ...(keystatic.headers ? { headers: keystatic.headers } : {}),
    });
  } catch (err) {
    console.error('[keystatic/api] handler error:', err);
    return new Response(
      JSON.stringify({
        error: 'Keystatic GitHub OAuth not configured.',
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 503,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
};

export const POST = GET;
