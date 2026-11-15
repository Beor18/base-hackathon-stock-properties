-- Accasa's only database: things that cannot live onchain. Run once in the Supabase SQL editor.
-- Both tables are closed to the public API (RLS on, no policies, no grants to anon/authenticated):
-- only the app's server reads and writes them, with the secret key (service_role).

-- A broker's reservation offer. The short link /o/<id> resolves to this row, so nobody can change
-- the broker's account or name in the URL. `broker_verified` is true when the broker's sign-in email
-- matched the listing agent's email on Smarlin at creation time (the email itself is never stored).
create table if not exists public.reservation_offers (
  id text primary key check (id ~ '^[A-Za-z0-9]{10}$'),
  property_ref text not null check (char_length(property_ref) <= 600),
  source_url text check (char_length(source_url) <= 600),
  deposit_pct numeric(4, 1) not null check (deposit_pct >= 1 and deposit_pct <= 10),
  broker_address text not null check (broker_address ~ '^0x[0-9a-fA-F]{40}$'),
  broker_name text not null check (char_length(broker_name) between 1 and 80),
  broker_company text check (char_length(broker_company) <= 80),
  broker_verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reservation_offers_broker_idx on public.reservation_offers (lower(broker_address));
alter table public.reservation_offers enable row level security;

-- When each broker last opened their inbox ("Reservas a tu favor"); newer events show as new.
create table if not exists public.broker_inbox (
  account text primary key check (account ~ '^0x[0-9a-f]{40}$'),
  seen_at timestamptz not null default now()
);
alter table public.broker_inbox enable row level security;

revoke all on public.reservation_offers, public.broker_inbox from anon, authenticated;
grant select, insert, update on public.reservation_offers, public.broker_inbox to service_role;
