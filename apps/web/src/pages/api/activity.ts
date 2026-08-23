export const prerender = false;
import type { APIRoute } from 'astro';
import { createApp } from '../../server/app';
import { buildDeps } from '../../server/deps';
import { getWorkerEnv } from '../../server/env';

export const GET: APIRoute = async (ctx) => {
  const env = await getWorkerEnv(ctx.locals);
  return createApp(buildDeps(env)).fetch(ctx.request);
};

export const ALL: APIRoute = GET;
