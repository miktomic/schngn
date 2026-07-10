declare global {
  interface SCHNGND1PreparedStatement {
    bind(...values: unknown[]): SCHNGND1PreparedStatement;
    run(): Promise<unknown>;
  }

  interface SCHNGND1Database {
    prepare(query: string): SCHNGND1PreparedStatement;
  }

  namespace App {
    interface Platform {
      env: {
        DB?: SCHNGND1Database;
        PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
        CLERK_SECRET_KEY?: string;
        CLERK_WEBHOOK_SIGNING_SECRET?: string;
      };
      context: unknown;
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
