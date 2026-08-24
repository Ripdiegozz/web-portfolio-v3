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

let parsedLocalEnv: Record<string, string> | null = null;

function getLocalFileEnv(): Record<string, string> {
  if (parsedLocalEnv) return parsedLocalEnv;
  parsedLocalEnv = {};
  if (typeof process === 'undefined') return parsedLocalEnv;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path');
    const cwd = process.cwd();
    const candidatePaths = [
      path.resolve(cwd, '.env'),
      path.resolve(cwd, 'apps/web/.env'),
      path.resolve(cwd, '.dev.vars'),
      path.resolve(cwd, 'apps/web/.dev.vars'),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const match = trimmed.match(/^([\w_]+)\s*=\s*(?:["']?)(.*?)(?:["']?)$/);
          if (match && match[1] && match[2] !== undefined) {
            parsedLocalEnv[match[1]] = match[2];
          }
        }
      }
    }
  } catch {
    // ignore in environments without node:fs
  }

  return parsedLocalEnv;
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
  let runtimeEnv: Record<string, unknown> | null = null;
  let modEnv: Record<string, unknown> | null = null;

  try {
    const r = (locals as { runtime?: { env?: Record<string, unknown> } })?.runtime;
    if (r?.env) runtimeEnv = r.env;
  } catch {
    // ignore
  }

  try {
    const mod = await import('cloudflare:workers');
    if (mod?.env) modEnv = mod.env as Record<string, unknown>;
  } catch {
    // ignore
  }

  // In dev mode (astro dev / Node), merge with process.env, import.meta.env, and local .env files
  const fileEnv = getLocalFileEnv();
  const proc = typeof process !== 'undefined' ? process.env : {};
  const meta = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env as unknown as Record<string, string>) : {};

  const getVal = (key: string): string => {
    return (
      (runtimeEnv?.[key] as string) ||
      (modEnv?.[key] as string) ||
      (proc?.[key] as string) ||
      (meta?.[key] as string) ||
      (fileEnv?.[key] as string) ||
      ''
    );
  };

  const kv = (runtimeEnv?.RATE_LIMIT_KV ?? modEnv?.RATE_LIMIT_KV) as WorkerBindings['RATE_LIMIT_KV'];

  return {
    ...(runtimeEnv || {}),
    ...(modEnv || {}),
    RATE_LIMIT_KV: kv,
    GITHUB_TOKEN: getVal('GITHUB_TOKEN'),
    TURNSTILE_SECRET_KEY: getVal('TURNSTILE_SECRET_KEY') || '1x0000000000000000000000000000000AA',
    RESEND_API_KEY: getVal('RESEND_API_KEY'),
    KEYSTATIC_GITHUB_CLIENT_ID: getVal('KEYSTATIC_GITHUB_CLIENT_ID'),
    KEYSTATIC_GITHUB_CLIENT_SECRET: getVal('KEYSTATIC_GITHUB_CLIENT_SECRET'),
    KEYSTATIC_SECRET: getVal('KEYSTATIC_SECRET'),
  };
}

