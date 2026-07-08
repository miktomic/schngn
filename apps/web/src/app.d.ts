declare global {
  interface SCHNGNKVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number; expiration?: number; metadata?: unknown }): Promise<void>;
    delete(key: string): Promise<void>;
  }

  namespace App {
    interface Platform {
      env: {
        WAITLIST?: SCHNGNKVNamespace;
      };
      context: unknown;
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
