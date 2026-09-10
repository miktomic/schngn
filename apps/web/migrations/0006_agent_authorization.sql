-- OAuth consent transactions contain no trip data. Token material remains in OAUTH_KV.
CREATE TABLE agent_consent_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  request_url TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX agent_consent_expiry ON agent_consent_transactions(expires_at);
-- Strongly consistent deny list covers KV revocation propagation (10-minute tokens).
CREATE TABLE agent_revoked_grants (
  grant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (grant_id, user_id)
);
-- RFC 7009 revocation stores only a digest until the short-lived token expires.
CREATE TABLE agent_revoked_tokens (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
