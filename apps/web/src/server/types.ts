/** Structural KV surface we rely on; keeps limiter logic decoupled from workers-types versions. */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

/** Workers Cache API surface (caches.default). */
export interface CacheLike {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

export interface FetcherLike {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface WorkerBindings extends Record<string, unknown> {
  ASSETS?: FetcherLike | undefined;
  RATE_LIMIT_KV?: KVLike | undefined;
  RESEND_API_KEY?: string | undefined;
  TURNSTILE_SECRET_KEY?: string | undefined;
  GITHUB_TOKEN?: string | undefined;
  KEYSTATIC_GITHUB_CLIENT_ID?: string | undefined;
  KEYSTATIC_GITHUB_CLIENT_SECRET?: string | undefined;
  KEYSTATIC_SECRET?: string | undefined;
}
