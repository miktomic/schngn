-- Clerk deletion replay guard. Store only a one-way account-id digest, never the raw Clerk id.
-- Markers expire after 30 days (longer than session, webhook retry, and in-flight request windows)
-- and are opportunistically purged by account repository operations.
create table if not exists account_deletion_tombstones (
  clerk_user_id_hash text primary key not null check (
    length(clerk_user_id_hash) = 64 and clerk_user_id_hash not glob '*[^0-9a-f]*'
  ),
  deleted_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  expires_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+30 days'))
    check (expires_at > deleted_at)
);
