-- Run this in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create table if not exists cycle_archive (
  id bigint generated always as identity primary key,
  cycle_label text not null,
  archived_at timestamptz not null default now(),
  entry_id text not null,
  player_name text,
  gamer_id text,
  alliance_tag text,
  first_bag jsonb,
  first_at bigint,
  latest_bag jsonb,
  latest_at bigint,
  final_bag jsonb,
  final_at bigint,
  screenshot text
);

alter table cycle_archive enable row level security;

-- This matches an "open to the anon/publishable key" policy, the same way
-- your existing entries/cycles/settings tables are already set up (the app
-- has no Supabase Auth login, it uses its own PIN system instead).
-- If your other tables use a different, more restrictive policy, use that
-- same policy here instead of this one.
create policy "Allow all access to cycle_archive"
  on cycle_archive
  for all
  using (true)
  with check (true);
