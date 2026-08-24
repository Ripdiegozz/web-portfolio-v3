export const prerender = false;
import type { APIRoute } from 'astro';
import { createApp } from '../../server/app';
import { buildDeps } from '../../server/deps';
import { getWorkerEnv } from '../../server/env';
import { emptyGrid } from '../../server/activity/mapper';

export const GET: APIRoute = async (ctx) => {
  try {
    const env = await getWorkerEnv(ctx.locals);
    return await createApp(buildDeps(env)).fetch(ctx.request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[activity-route-error]', err);
    return new Response(
      JSON.stringify({ ok: true, cached: false, error: message, data: emptyGrid() }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
};

export const ALL: APIRoute = GET;
