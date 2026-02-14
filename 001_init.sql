-- 001_init.sql
  times_of_day text[] not null default array[]::text[],
  days_of_week int[] not null default array[]::int[],
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists user_schedules_user_idx on public.user_schedules(user_id);

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

create table if not exists public.daily_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current integer not null default 0,
  best integer not null default 0,
  last_completed_date date
);

-- MVP-2: verification
create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  verifier_user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('buddy','host')),
  status text not null default 'confirmed' check (status in ('confirmed','disputed')),
  created_at timestamptz not null default now(),
  unique(session_id, verifier_user_id)
);

-- updated_at trigger
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();