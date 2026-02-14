-- Sprint 2 seed: disciplines + room templates

insert into public.disciplines (slug, title, unit)
values
  ('pushups', 'Push-ups', 'reps'),
  ('meditation', 'Meditation', 'minutes'),
  ('wim_hof', 'Wim Hof Breathing', 'minutes')
on conflict (slug) do update
set title = excluded.title,
    unit = excluded.unit;

insert into public.room_templates (discipline_id, slug, title, verification_mode, is_featured)
select d.id, t.slug, t.title, t.verification_mode, t.is_featured
from (
  values
    ('pushups', 'pushups-hourly', 'Push-ups Hourly', 'self', true),
    ('pushups', 'pushups-endurance', 'Push-ups Endurance', 'self', false),
    ('meditation', 'meditation-focus', 'Meditation Focus', 'buddy', true),
    ('meditation', 'meditation-sleep', 'Meditation Sleep Reset', 'self', false),
    ('wim_hof', 'wim-hof-breathing', 'Wim Hof Breathing', 'host', true)
) as t(discipline_slug, slug, title, verification_mode, is_featured)
join public.disciplines d on d.slug = t.discipline_slug
on conflict (slug) do update
set title = excluded.title,
    verification_mode = excluded.verification_mode,
    is_featured = excluded.is_featured;
