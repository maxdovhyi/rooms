-- 002_views.sql

create or replace view public.leaderboard_today as
select
  s.user_id,
  p.handle,
  p.avatar_seed,
  sum(s.result_value) as total_value,
  sum(s.xp_awarded) as total_xp,
  date_trunc('day', now()) as day
from public.sessions s
join public.profiles p on p.user_id = s.user_id
where s.created_at >= date_trunc('day', now())
group by s.user_id, p.handle, p.avatar_seed;

create or replace view public.leaderboard_week as
select
  s.user_id,
  p.handle,
  p.avatar_seed,
  sum(s.result_value) as total_value,
  sum(s.xp_awarded) as total_xp
from public.sessions s
join public.profiles p on p.user_id = s.user_id
where s.created_at >= date_trunc('week', now())
group by s.user_id, p.handle, p.avatar_seed;