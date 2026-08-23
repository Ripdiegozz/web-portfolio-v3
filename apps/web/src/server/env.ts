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
