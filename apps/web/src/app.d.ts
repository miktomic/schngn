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
      };
      context: unknown;
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
