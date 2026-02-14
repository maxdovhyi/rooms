-- Challenges v1

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('checkin','metric')),
  rules_json jsonb not null default '{}'::jsonb,
  start_at timestamptz not null default now(),
  end_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  invite_code text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_members (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('creator','member')),
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create table if not exists public.challenge_checkins (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  status text not null check (status in ('ok','fail')),
  notes text,
  created_at timestamptz not null default now(),
  primary key (challenge_id, user_id, date)
);

create table if not exists public.challenge_events (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists challenges_creator_idx on public.challenges(created_by, created_at desc);
create index if not exists challenge_members_user_idx on public.challenge_members(user_id, joined_at desc);
create index if not exists challenge_checkins_user_date_idx on public.challenge_checkins(user_id, date desc);
create index if not exists challenge_events_challenge_idx on public.challenge_events(challenge_id, created_at desc);

alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;
alter table public.challenge_checkins enable row level security;
alter table public.challenge_events enable row level security;

drop policy if exists "challenges_member_select" on public.challenges;
create policy "challenges_member_select" on public.challenges
for select to authenticated
using (
  exists (
    select 1 from public.challenge_members cm
    where cm.challenge_id = challenges.id and cm.user_id = auth.uid()
  )
);

drop policy if exists "challenges_creator_insert" on public.challenges;
create policy "challenges_creator_insert" on public.challenges
for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists "challenge_members_select_member" on public.challenge_members;
create policy "challenge_members_select_member" on public.challenge_members
for select to authenticated
using (
  exists (
    select 1 from public.challenge_members cm
    where cm.challenge_id = challenge_members.challenge_id and cm.user_id = auth.uid()
  )
);

drop policy if exists "challenge_members_insert_creator" on public.challenge_members;
create policy "challenge_members_insert_creator" on public.challenge_members
for insert to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.challenge_members cm
    where cm.challenge_id = challenge_members.challenge_id and cm.user_id = auth.uid() and cm.role = 'creator'
  )
);

drop policy if exists "challenge_checkins_member_select" on public.challenge_checkins;
create policy "challenge_checkins_member_select" on public.challenge_checkins
for select to authenticated
using (
  exists (
    select 1 from public.challenge_members cm
    where cm.challenge_id = challenge_checkins.challenge_id and cm.user_id = auth.uid()
  )
);

drop policy if exists "challenge_checkins_self_insert" on public.challenge_checkins;
create policy "challenge_checkins_self_insert" on public.challenge_checkins
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.challenge_members cm
    where cm.challenge_id = challenge_checkins.challenge_id and cm.user_id = auth.uid()
  )
);

drop policy if exists "challenge_events_member_select" on public.challenge_events;
create policy "challenge_events_member_select" on public.challenge_events
for select to authenticated
using (
  exists (
    select 1 from public.challenge_members cm
    where cm.challenge_id = challenge_events.challenge_id and cm.user_id = auth.uid()
  )
);
