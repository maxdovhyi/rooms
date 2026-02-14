-- Sprint 4: scoring + history

alter table public.sessions
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists participant_key text,
  add column if not exists result_value integer,
  add column if not exists xp_awarded integer,
  add column if not exists attendance_ratio numeric(5,4),
  add column if not exists completed_at timestamptz;

create index if not exists sessions_user_idx on public.sessions(user_id, created_at desc);
create index if not exists sessions_participant_idx on public.sessions(participant_key, created_at desc);

create table if not exists public.guest_streaks (
  participant_key text primary key,
  current integer not null default 0,
  best integer not null default 0,
  last_completed_date date
);

alter table public.sessions enable row level security;
alter table public.daily_streaks enable row level security;
alter table public.guest_streaks enable row level security;

drop policy if exists "sessions_select_public" on public.sessions;
create policy "sessions_select_public"
on public.sessions
for select
to anon, authenticated
using (true);

drop policy if exists "sessions_insert_public" on public.sessions;
create policy "sessions_insert_public"
on public.sessions
for insert
to anon, authenticated
with check (true);

drop policy if exists "daily_streaks_select_public" on public.daily_streaks;
create policy "daily_streaks_select_public"
on public.daily_streaks
for select
to anon, authenticated
using (true);

drop policy if exists "guest_streaks_select_public" on public.guest_streaks;
create policy "guest_streaks_select_public"
on public.guest_streaks
for select
to anon, authenticated
using (true);
