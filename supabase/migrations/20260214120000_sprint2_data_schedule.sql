-- Sprint 2: data model + schedule baseline

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (char_length(handle) between 3 and 20),
  avatar_seed text not null default 'seed',
  timezone text not null default 'UTC',
  age smallint not null check (age between 13 and 120),
  gender text not null check (gender in ('male', 'female', 'other', 'prefer_not')),
  xp_total integer not null default 0,
  level integer not null default 1,
  reputation_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.disciplines (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  unit text not null default 'reps',
  created_at timestamptz not null default now()
);

create table if not exists public.room_templates (
  id uuid primary key default gen_random_uuid(),
  discipline_id uuid not null references public.disciplines(id) on delete cascade,
  slug text unique not null,
  title text not null,
  verification_mode text not null default 'self' check (verification_mode in ('self', 'buddy', 'host')),
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.scheduled_rooms (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.room_templates(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'running', 'ended', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (template_id, start_at)
);

create index if not exists profiles_handle_idx on public.profiles(handle);
create index if not exists disciplines_slug_idx on public.disciplines(slug);
create index if not exists room_templates_featured_idx on public.room_templates(is_featured, created_at desc);
create index if not exists room_templates_discipline_idx on public.room_templates(discipline_id);
create index if not exists scheduled_rooms_start_idx on public.scheduled_rooms(start_at);
create index if not exists scheduled_rooms_template_start_idx on public.scheduled_rooms(template_id, start_at);

alter table public.room_templates enable row level security;
alter table public.scheduled_rooms enable row level security;

drop policy if exists "room_templates_select_public" on public.room_templates;
create policy "room_templates_select_public"
on public.room_templates
for select
to anon, authenticated
using (true);

drop policy if exists "scheduled_rooms_select_public" on public.scheduled_rooms;
create policy "scheduled_rooms_select_public"
on public.scheduled_rooms
for select
to anon, authenticated
using (true);
