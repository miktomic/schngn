create table if not exists waitlist_signups (
  email text primary key not null check (length(email) between 3 and 254),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  consent integer not null check (consent = 1),
  consent_version text not null,
  source text not null check (source in ('waitlist', 'pdf_export', 'unlock_planner', 'landing', 'production_smoke')),
  price_bucket text check (
    price_bucket is null or price_bucket in ('eur_5', 'eur_9', 'eur_19', 'gbp_5', 'gbp_9', 'gbp_19')
  )
);
