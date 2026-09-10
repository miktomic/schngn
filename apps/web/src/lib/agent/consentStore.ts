import type { AccountD1Database } from '../account/accountRepository';
export interface ConsentStore {
  create(userId: string, sessionId: string, requestUrl: string): Promise<string>;
  consume(id: string, userId: string, sessionId: string): Promise<string | null>;
}
export function consentStore(db: AccountD1Database): ConsentStore {
  return {
    async create(userId, sessionId, requestUrl) {
      const now = Math.floor(Date.now() / 1000);
      await db.prepare('delete from agent_consent_transactions where expires_at <= ?1').bind(now).run();
      const id = crypto.randomUUID();
      await db.prepare('insert into agent_consent_transactions (id, user_id, session_id, request_url, expires_at) values (?1, ?2, ?3, ?4, ?5)').bind(id, userId, sessionId, requestUrl, now + 300).run();
      return id;
    },
    async consume(id, userId, sessionId) {
      const row = await db.prepare('delete from agent_consent_transactions where id = ?1 and user_id = ?2 and session_id = ?3 and expires_at > ?4 returning request_url').bind(id, userId, sessionId, Math.floor(Date.now() / 1000)).first<{ request_url: string }>();
      return row?.request_url ?? null;
    }
  };
}
