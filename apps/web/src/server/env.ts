import type { WorkerBindings } from './types';

export type { WorkerBindings };

/**
 * Minimal shape of the Worker environment needed by Keystatic routes.
 * Values arrive as runtime bindings in production and .env vars in dev.
 */
export interface KeystaticApiEnv {
  KEYSTATIC_GITHUB_CLIENT_ID?: string;
  KEYSTATIC_GITHUB_CLIENT_SECRET?: string;
  KEYSTATIC_SECRET?: string;
  [key: string]: unknown;
}

/**
 * Resolve the full Worker bindings for API routes.
 *
 * Astro v6 REMOVED locals.runtime.env: the adapter installs a getter that
 * throws on access. The canonical source is now cloudflare:workers; the legacy
 * path stays only as a fallback for older adapters. Total failure yields an
 * empty bindings object so routes degrade instead of crashing on resolution.
 */
export async function getWorkerEnv(locals: unknown): Promise<WorkerBindings> {
  try {
    const mod = await import('cloudflare:workers');
    return mod.env as unknown as WorkerBindings;
  } catch (err) {
    // The import may fail in plain-node dev; log it so prod failures are never
    // silently blamed on missing env vars downstream.
    console.warn('[server] cloudflare:workers env unavailable; falling back', err);
    try {
      const runtimeEnv = (locals as { runtime?: { env?: WorkerBindings } })?.runtime?.env;
      return runtimeEnv ?? {};
    } catch {
      return {};
    }
  }
}
