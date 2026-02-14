-- Room mechanics modes for Sprint 5 room experience

alter table public.room_templates
  add column if not exists mode text not null default 'counter' check (mode in ('counter','timer_steps','breath_cycle')),
  add column if not exists program jsonb not null default '{}'::jsonb;

create index if not exists room_templates_mode_idx on public.room_templates(mode);
