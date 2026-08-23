import type { AppDeps } from './app';
import type { WorkerBindings } from './types';

/**
 * Placeholder dependency graph. Real implementations arrive in Task 15
 * (contact pipeline) and Task 17 (GitHub activity fetcher).
 */
export function buildDeps(env: WorkerBindings): AppDeps {
  // Bindings stay unread until Tasks 15/17 wire real implementations.
  void env;
  return {
    contact: {
      parseBody: async () => {
        throw new Error('contact pipeline not implemented until Task 15');
      },
      rateLimit: async () => true,
      verifyTurnstile: async () => true,
      sendEmail: async () => {},
    },
    activity: {
      fetchActivity: async () => ({ totalContributions: 0, weeks: [] }),
      readCache: async () => undefined,
      writeCache: async () => {},
    },
  };
}
