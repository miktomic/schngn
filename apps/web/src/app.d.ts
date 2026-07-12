declare global {
  interface SCHNGND1PreparedStatement {
    bind(...values: unknown[]): SCHNGND1PreparedStatement;
    run(): Promise<unknown>;
  }

  interface SCHNGND1Database {
    prepare(query: string): SCHNGND1PreparedStatement;
  }

  interface SCHNGNEmailBinding {
    send(message: {
      to?: string;
      from: string | { email: string; name?: string };
      replyTo?: string;
      subject: string;
      text: string;
    }): Promise<unknown>;
  }

  interface SCHNGNRateLimitBinding {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  }

  interface SCHNGNTurnstileApi {
    render(container: HTMLElement, options: Record<string, unknown>): string;
    reset(widgetId: string): void;
    remove(widgetId: string): void;
  }

  interface Window {
    turnstile?: SCHNGNTurnstileApi;
  }

  namespace App {
    interface Platform {
      env: {
        DB?: SCHNGND1Database;
        PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
        CLERK_SECRET_KEY?: string;
        CLERK_WEBHOOK_SIGNING_SECRET?: string;
        PUBLIC_TURNSTILE_SITE_KEY?: string;
        TURNSTILE_SECRET_KEY?: string;
        CONTACT_EMAIL?: SCHNGNEmailBinding;
        CONTACT_RATE_LIMITER?: SCHNGNRateLimitBinding;
      };
      context: unknown;
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
