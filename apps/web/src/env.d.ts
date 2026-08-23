/// <reference types="astro/client" />

declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
  /** Structural Cache API surface (caches.default); same shape as CacheLike in server/types. */
  export const caches: {
    default: {
      match(request: Request): Promise<Response | undefined>;
      put(request: Request, response: Response): Promise<void>;
    };
  };
}

/**
 * Ambient stand-in for Node's `process`, which has no @types/node in this
 * workspace. Only keystatic.config.ts touches it, guarded at runtime.
 * Replace with @types/node if/when server-only tooling needs it.
 */
declare const process: { env?: Record<string, string | undefined> } | undefined;
