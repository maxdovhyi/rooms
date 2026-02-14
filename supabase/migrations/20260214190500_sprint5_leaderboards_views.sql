-- Sprint 5: leaderboard views

create or replace view public.leaderboard_today as
select
  s.user_id,
  coalesce(p.handle, s.participant_key, 'guest') as handle,
  coalesce(sum(s.result_value), 0) as total_value,
  coalesce(sum(s.xp_awarded), 0) as total_xp,
  date_trunc('day', now()) as day
from public.sessions s
left join public.profiles p on p.user_id = s.user_id
where s.status = 'ended'
  and s.created_at >= date_trunc('day', now())
group by s.user_id, p.handle, s.participant_key;

create or replace view public.leaderboard_week as
select
  s.user_id,
  coalesce(p.handle, s.participant_key, 'guest') as handle,
  coalesce(sum(s.result_value), 0) as total_value,
  coalesce(sum(s.xp_awarded), 0) as total_xp
from public.sessions s
left join public.profiles p on p.user_id = s.user_id
where s.status = 'ended'
  and s.created_at >= date_trunc('week', now())
group by s.user_id, p.handle, s.participant_key;
