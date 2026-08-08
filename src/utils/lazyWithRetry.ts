import { lazy } from 'react';
import type { ComponentType } from 'react';

/**
 * Wraps React.lazy imports with an automatic page reload if a chunk fails to load
 * (e.g. after a new deployment when old JS bundle hashes no longer exist on the server).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(() =>
    componentImport().catch((error: Error) => {
      // Guard against infinite reload loops if there is a persistent error
      const storageKey = 'chunk_reload_retry';
      const hasReloaded = sessionStorage.getItem(storageKey);

      if (!hasReloaded) {
        sessionStorage.setItem(storageKey, 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => {}); // Prevent unhandled promise rejection while page reloads
      }

      // If already reloaded and chunk still fails to load, reset key and throw error
      sessionStorage.removeItem(storageKey);
      throw error;
    })
  );
}
