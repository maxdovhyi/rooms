-- MVP-1 INIT (safe) for Supabase
-- Run this whole script in Supabase SQL Editor

-- 0) extensions
create extension if not exists pgcrypto;

-- 1) profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (char_length(handle) between 3 and 20),
  avatar_seed text not null default 'seed',
  timezone text not null default 'UTC',
  age smallint not null check (age between 13 and 120),
  gender text not null check (gender in ('male','female','other','prefer_not')),
  xp_total integer not null default 0,
  level integer not null default 1,
  reputation_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_handle_idx on public.profiles(handle);

-- 2) disciplines (what type of room)
create table if not exists public.disciplines (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  unit text not null default 'reps', -- reps / minutes / points
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- seed disciplines (idempotent)
insert into public.disciplines (slug, title, unit)
values
  ('pushups', 'Push-ups', 'reps'),
  ('meditation', 'Meditation', 'minutes'),
  ('wim_hof', 'Wim Hof Breathing', 'minutes')
on conflict (slug) do nothing;

-- 3) room templates (defines programs + visuals later)
create table if not exists public.room_templates (
  id uuid primary key default gen_random_uuid(),
  discipline_id uuid not null references public.disciplines(id) on delete cascade,
  slug text unique not null,
  title text not null,
  description text,
  program_json jsonb not null default '{}'::jsonb,
  default_duration_sec integer not null default 360,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists room_templates_disc_idx on public.room_templates(discipline_id);

-- seed room templates (idempotent)
insert into public.room_templates (discipline_id, slug, title, description, default_duration_sec, program_json)
select d.id,
       'pushups_hourly',
       'Push-ups Room',
       'Intervals: work/rest. Tap +1/+5/+10 as you go.',
       360,
       jsonb_build_object(
         'steps', jsonb_build_array(
           jsonb_build_object('type','prep','durationSec',20,'title','Prepare','text','Shoulders down, core tight, breathe calm.'),
           jsonb_build_object('type','work','durationSec',60,'title','Work','text','Do push-ups. Tap +10/+5/+1.'),
           jsonb_build_object('type','rest','durationSec',20,'title','Rest','text','Shake arms, inhale/exhale.'),
           jsonb_build_object('type','work','durationSec',60,'title','Work','text','Do push-ups. Tap +10/+5/+1.'),
           jsonb_build_object('type','rest','durationSec',20,'title','Rest','text','Breathe.'),
           jsonb_build_object('type','work','durationSec',60,'title','Work','text','Do push-ups. Tap +10/+5/+1.'),
           jsonb_build_object('type','rest','durationSec',20,'title','Rest','text','Breathe.'),
           jsonb_build_object('type','work','durationSec',60,'title','Work','text','Finish strong. Tap +10/+5/+1.'),
           jsonb_build_object('type','finish','durationSec',20,'title','Done','text','Stop. Note your total and recover breathing.')
         )
       )
from public.disciplines d
where d.slug = 'pushups'
on conflict (slug) do nothing;

insert into public.room_templates (discipline_id, slug, title, description, default_duration_sec, program_json)
select d.id,
       'meditation_hourly',
       'Meditation Room',
       'Guided 6-minute focus session.',
       360,
       jsonb_build_object(
         'steps', jsonb_build_array(
           jsonb_build_object('type','prep','durationSec',30,'title','Sit','text','Sit comfortably. Straight spine. Close eyes.'),
           jsonb_build_object('type','guidance','durationSec',30,'title','Breath','text','Attention on breathing. In/out.'),
           jsonb_build_object('type','guidance','durationSec',240,'title','Focus','text','If thoughts pull you, gently return to breath.'),
           jsonb_build_object('type','guidance','durationSec',60,'title','Body scan','text','Relax face, shoulders, belly.'),
           jsonb_build_object('type','finish','durationSec',0,'title','Finish','text','Open your eyes. Mark session.')
         )
       )
from public.disciplines d
where d.slug = 'meditation'
on conflict (slug) do nothing;

insert into public.room_templates (discipline_id, slug, title, description, default_duration_sec, program_json)
select d.id,
       'wim_hof_hourly',
       'Wim Hof Room',
       '2 rounds (MVP). Do seated/lying. Not in water, not driving.',
       360,
       jsonb_build_object(
         'safety', jsonb_build_object(
           'text','Do seated/lying. Not in water, not driving. Stop if dizzy.'
         ),
         'steps', jsonb_build_array(
           jsonb_build_object('type','prep','durationSec',20,'title','Prepare','text','Sit/lie down. Deep inhale, relaxed exhale.'),
           jsonb_build_object('type','breathe','durationSec',90,'title','Breathing','text','30–40 breaths. Full inhale, relaxed exhale.'),
           jsonb_build_object('type','hold','durationSec',60,'title','Hold','text','Hold after exhale. Relax.'),
           jsonb_build_object('type','recover','durationSec',15,'title','Recover','text','Deep inhale and hold briefly.'),
           jsonb_build_object('type','breathe','durationSec',90,'title','Breathing','text','Second round: same rhythm.'),
           jsonb_build_object('type','hold','durationSec',60,'title','Hold','text','Hold after exhale.'),
           jsonb_build_object('type','recover','durationSec',15,'title','Recover','text','Deep inhale and hold.'),
           jsonb_build_object('type','finish','durationSec',10,'title','Done','text','Breathe normally. Mark session.')
         )
       )
from public.disciplines d
where d.slug = 'wim_hof'
on conflict (slug) do nothing;

-- 4) scheduled rooms (hourly slots)
create table if not exists public.scheduled_rooms (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.room_templates(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','running','ended','cancelled')),
  created_at timestamptz not null default now(),
  unique (template_id, start_at)
);

create index if not exists scheduled_rooms_time_idx on public.scheduled_rooms(start_at);
create index if not exists scheduled_rooms_template_idx on public.scheduled_rooms(template_id);

-- 5) sessions (a run inside a scheduled room)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  scheduled_room_id uuid not null references public.scheduled_rooms(id) on delete cascade,
  program_id uuid references public.room_templates(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting','running','ended')),
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sessions_room_idx on public.sessions(scheduled_room_id, created_at desc);

-- 6) session participants (per user totals)
create table if not exists public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_value integer not null default 0,
  ready boolean not null default false,
  joined_at timestamptz not null default now(),
  unique(session_id, user_id)
);

create index if not exists session_participants_idx on public.session_participants(session_id);
create index if not exists session_participants_user_idx on public.session_participants(user_id);

-- 7) user schedules (optional prefs)
create table if not exists public.user_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  times_of_day text[] not null default '{}'::text[],
  days_of_week int[] not null default '{}'::int[],
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists user_schedules_user_idx on public.user_schedules(user_id);

-- 8) invites + friends (base)
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','expired')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists invites_creator_idx on public.invites(created_by_user_id, created_at desc);

create table if not exists public.friend_edges (
  id uuid primary key default gen_random_uuid(),
  user_id_a uuid not null references auth.users(id) on delete cascade,
  user_id_b uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','blocked')),
  created_at timestamptz not null default now(),
  unique(user_id_a, user_id_b)
);

create index if not exists friend_edges_a_idx on public.friend_edges(user_id_a);
create index if not exists friend_edges_b_idx on public.friend_edges(user_id_b);

-- 9) streaks
create table if not exists public.daily_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current integer not null default 0,
  best integer not null default 0,
  last_completed_date date
);

-- 10) updated_at trigger helper + profiles trigger
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();
