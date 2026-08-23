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
  let bindings: WorkerBindings;
  try {
    const mod = await import('cloudflare:workers');
    bindings = (mod.env as unknown as WorkerBindings) ?? {};
  } catch {
    try {
      const runtimeEnv = (locals as { runtime?: { env?: WorkerBindings } })?.runtime?.env;
      bindings = runtimeEnv ?? {};
    } catch {
      bindings = {};
    }
  }

  // In dev mode (astro dev / Node), merge with process.env, import.meta.env, and local .env files
  const fileEnv = getLocalFileEnv();
  const proc = typeof process !== 'undefined' ? process.env : {};
  const meta = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env as unknown as Record<string, string>) : {};

  return {
    ...bindings,
    GITHUB_TOKEN:
      bindings.GITHUB_TOKEN ||
      proc.GITHUB_TOKEN ||
      meta.GITHUB_TOKEN ||
      fileEnv.GITHUB_TOKEN ||
      '',
    TURNSTILE_SECRET_KEY:
      bindings.TURNSTILE_SECRET_KEY ||
      proc.TURNSTILE_SECRET_KEY ||
      meta.TURNSTILE_SECRET_KEY ||
      fileEnv.TURNSTILE_SECRET_KEY ||
      '1x0000000000000000000000000000000AA',
    RESEND_API_KEY:
      bindings.RESEND_API_KEY ||
      proc.RESEND_API_KEY ||
      meta.RESEND_API_KEY ||
      fileEnv.RESEND_API_KEY ||
      '',
  };
}

