create table if not exists account_trip_snapshots (
  clerk_user_id text primary key not null check (length(clerk_user_id) between 1 and 256),
  schema_version integer not null default 1 check (schema_version = 1),
  revision integer not null check (revision >= 1),
  trips_json text not null check (length(trips_json) <= 1000000 and json_valid(trips_json)),
  consent_version text not null check (consent_version = 'account-sync-v1'),
  consented_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
