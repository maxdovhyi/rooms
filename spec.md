# Ritual Rooms — ТЗ для Codex (MVP Web/PWA)

> ⚡ Обновление: добавлены wireframes (визуальные схемы), онбординг с возрастом/полом, друзья/контакты, «расписание по комнате», и расширенная структура БД под дальнейшее масштабирование.


> Цель: быстрый MVP «комнаты-ритуалы» с реалтаймом: лобби → комната → чек-ин результата → XP/стрик → лидерборд.  
> Подход: Web-first (Next.js) + PWA. Архитектура data-driven: новые дисциплины/комнаты добавляются данными.

---

## 0) Definition of Done (что считается готовым)

### MVP-1 (обязательное)
- Лобби с карточками комнат по расписанию (upcoming/live/finished), таймер до старта.
- Вход в live-комнату (реалтайм): таймер, аватарки участников, кнопки +1/+5/+10 и ручной ввод.
- Появляющиеся «попапы» над аватаром: +5/+10/+20 (микро-анимации).
- Общий «Raid Counter» комнаты + прогресс-бар цели (например 1000 reps).
- После завершения сета — фиксация результата (reps/minutes) и начисление XP.
- Стрики (daily) + базовый профиль с XP/уровнем.
- Лидерборд Self (today/week) по дисциплине и общий.

### MVP-2 (после MVP-1)
- Buddy-verify (подтверждение напарником) + Verified лидерборд.
- Личное расписание (подписки на шаблоны комнат).
- Ачивки (10–15).

---

## 1) Product Loop (петля удержания)

1) Пользователь видит ближайшую комнату (лобби) → 2) заходит → 3) делает сет вместе → 4) фиксирует результат → 5) получает XP/стрик/ранг → 6) видит своё место в таблице → 7) добавляет комнаты в расписание.

---

## 2) Роли и уровни доверия (на старте упрощённо)

### MVP-1
- Только Self-report (самоотчёт). Без спорных механизмов.

### MVP-2
- Buddy verification: любой пользователь может подтвердить сессию другого внутри ограниченного времени после сета.

---

## 3) Данные и сущности (минимально необходимое)

### Entities
- User
- Discipline
- RoomTemplate
- ScheduledRoom
- Session
- FriendEdge (друзья)
- Invite (инвайты)
- UserSchedule (подписки на шаблоны комнат)
- (MVP-2) Verification

### Поля (минимум)
**User**: id, handle, avatarSeed, timezone, xpTotal, level, reputationScore, age, gender, createdAt  
**Discipline**: id, name, category, unitType(reps|minutes|sessions), defaultSetDurationSec, scoringProfileId  
**RoomTemplate**: id, disciplineId, title, leagueRulesetId(optional), verificationMode(self|buddy|host), raidGoal(optional), isFeatured  
**ScheduledRoom**: id, roomTemplateId, startAt, endAt, status(upcoming|live|finished), minParticipantsToStart, hostUserId(optional)  
**Session**: id, scheduledRoomId, userId, joinedAt, leftAt, resultValue, xpAwarded, verificationStatus(pending|verified|rejected), verificationLevel(self|buddy|host)

**Invite**: id, code, createdByUserId, targetUserId(optional), status(pending|accepted|expired), createdAt, acceptedAt  
**FriendEdge**: id, userIdA, userIdB, status(pending|accepted|blocked), createdAt  
**UserSchedule**: id, userId, roomTemplateId, cadence(daily|weekly|custom), timesOfDay(array), daysOfWeek(array), isEnabled, createdAt

> Note: UserSchedule позволяет строить «My Stream» + будущий календарь.

---

## 4) Расписание комнат

### База
- Якорные комнаты: каждые 60 минут (минимум 1–2 дисциплины), плюс несколько прайм-тайм слотов.
- Комната стартует в статус LIVE ровно в startAt, но UI может показывать «ожидание» если участников меньше minParticipantsToStart.

### Статусы
- Upcoming: до startAt
- Live: startAt ≤ now < endAt
- Finished: now ≥ endAt

---

## 5) Счёт и XP (MVP-1)

### Счёт комнаты
- Room total = сумма resultValue всех участников (по событиям инкремента в live).
- Raid goal (опционально) — цель total, например 1000 reps.

### XP формула (простая)
- AttendanceXP = 10, если пользователь был в комнате ≥ 60% времени
- VolumeXP = floor(k * sqrt(resultValue)) (k зависит от дисциплины, default k=3)
- XP = AttendanceXP + VolumeXP
- Daily cap (пока можно без капа в MVP-1 или мягкий cap позже)

### Streak
- Daily streak увеличивается, если в день есть ≥1 завершённая сессия.

---

## 6) Реалтайм-интерактив в комнате (главная часть)

### UI-элементы комнаты
- Большой таймер (mm:ss)
- Grid «аватарок» участников (8–30)
- Над аватаром: всплывающие числа (например +10) при клике
- Справа/снизу: общий счёт комнаты + прогресс-бар цели (например 1000 reps)
- Кнопки: +1 +5 +10 и «ввести число»
- Блок «Schedule for this room»: Today slots + Weekly pattern

### Компоненты (чтобы Codex делал модульно)
- `RoomArena` (layout)
- `RoomHeader` (title + league + timer)
- `RoomScheduleStrip` (today slots + week pattern)
- `RaidCounterPanel` (total + goal + progress)
- `AvatarGrid`
- `AvatarChip` (avatar + small count + floating deltas)
- `FloatingDelta` (анимация +N)
- `IncrementControls` (+1/+5/+10 + manual)
- `PostSetPanel` (submit result + next room CTA)

### События реалтайма
- `presence_sync` (кто в комнате сейчас)
- `user_join`
- `user_leave`
- `increment` (userId, delta, at)
- `room_state_snapshot` (для новых подключений)

### Правила инкремента
- Нажатие +10 отправляет событие increment(delta=10)
- Клиент делает optimistic update, сервер подтверждает и рассылает всем.

### Анимации (минимализм)
- `FloatingDelta` появляется над аватаром в точке клика, поднимается вверх на 24–36px и исчезает за 650–900мс.
- Для raid total: короткая анимация изменения числа (count-up) 150–250мс.

---

## 7) Минималистичный визуал «комнаты» (без VR)

### Концепт: «Arena Card»
- Фон: мягкий градиент / плоский цвет (выбирается по дисциплине)
- Центр: Avatar Grid (круги)
- Верх: Timer
- Низ: Controls (+1/+5/+10)
- Право: Raid Counter + stats

### Аватары
- У каждого user: avatarSeed (генерируем цвет/паттерн локально)
- Для MVP без загрузки фото.

### Попапы над аватаром
- При increment показывать анимированное число: поднимается вверх и исчезает за 600–900мс.

---

## 8) Экраны (MVP-1)

### 8.0 Wireframes (минималистичные схемы)

#### Lobby (лента комнат)
```
┌────────────────────────────────────────┐
│ Ritual Rooms        🔥 Streak 4  LV 3  │
│ My Schedule | Featured | All           │
├────────────────────────────────────────┤
│ NEXT UP (your stream)                  │
│ ┌───────────────┐  ┌───────────────┐  │
│ │ Push-ups 🥈    │  │ Breath 🌬️     │  │
│ │ starts 03:12   │  │ starts 18:40  │  │
│ │ 12 inside      │  │ 4 inside      │  │
│ │ [Join]         │  │ [Join]        │  │
│ └───────────────┘  └───────────────┘  │
│ FEATURED                              │
│ ┌───────────────┐  ┌───────────────┐  │
│ │ Posture 🧍     │  │ Meditation 🧘  │  │
│ │ live now       │  │ starts 55:00  │  │
│ │ 7 inside       │  │ 2 inside      │  │
│ │ [Join]         │  │ [Join]        │  │
│ └───────────────┘  └───────────────┘  │
└────────────────────────────────────────┘
```

#### Room Live (Arena Card)
```
┌──────────────────────────────────────────┐
│ Push-ups 🥈  LIVE       05:12            │
│ Today: 10:00 11:00 12:00 13:00 14:00     │
│ Week:  Mon Tue Wed Thu Fri Sat Sun       │
├──────────────────────────────────────────┤
│ RAID GOAL: 1000 reps   ████████░░ 820    │
│ Room Total: 820   Your: 60   Rank: R2    │
├──────────────────────────────────────────┤
│  Avatar Grid (presence)                  │
│  ○A  ○B  ○C  ○D                           │
│  ○E  ○F  ○G  ○H                           │
│  (under each: small count)               │
│                                          │
│  popups: +10 +20 appear above avatar     │
├──────────────────────────────────────────┤
│  [+1]  [+5]  [+10]   [Enter]             │
│  Quick: [x2] [x5]   (optional later)     │
├──────────────────────────────────────────┤
│  After set: [Submit Result] [Confirm Buddy]
└──────────────────────────────────────────┘
```

#### Profile / Dashboard (после входа)
```
┌──────────────────────────────────────────┐
│ Hi, @nick     LV 3   XP 1240  🛡️ 42     │
│ Streak 🔥 4   League: Push-ups 🥈        │
├──────────────────────────────────────────┤
│ Achievements (tiles)                     │
│ [3-day streak] [100 reps] [10 rooms]     │
├──────────────────────────────────────────┤
│ Your Schedule (today)                    │
│ 10:00 Push-ups  [Join] [Unpin]           │
│ 12:00 Breath    [Join] [Unpin]           │
│ 20:00 Posture   [Join] [Unpin]           │
│ + Add room template                      │
├──────────────────────────────────────────┤
│ Friends (MVP-1 stub)                     │
│ [Add friend]  [Invites]                  │
└──────────────────────────────────────────┘
```

---

### 8.1 Onboarding (60 секунд)
- Ввод ника (handle) ✅
- Возраст (age) ✅
- Пол (gender: male/female/other/prefer_not) ✅
- Таймзона (auto) ✅
- Выбор 1–2 интересов (discipline) (опц.)
- Создать аккаунт → сразу на Dashboard

> Важно: возраст/пол собираем только если реально нужно для матчинг/статистики. Не показывать публично по умолчанию.

### 8.2 Dashboard (после входа, первая страница)
- Сводка: XP/Level, Streak, Reputation
- Achievements (доска)
- Your Schedule (подписки на комнаты) + кнопка «Add»
- Быстрый блок: ближайшая комната (Join)
- Friends (пока минимум)

### 8.3 Lobby
- Tabs: My Schedule | Featured | All
- Cards: название, дисциплина, статус, таймер, людей внутри
- CTA: Join

### 8.4 Room Live
- Компоненты Arena (см. Wireframe)
- Блок «Schedule for this room»:
  - Today slots (время) + Join
  - Weekly pattern (пока как кнопки/текст)

### 8.5 Profile
- XP total, level
- daily streak
- reputation score
- last sessions

### 8.6 Leaderboards
- Today / Week
- By discipline / Overall

---

## 8.7 Friends (MVP-1 минимально + база под рост)

### Цели Friends
- Быстро пригласить друга по ссылке
- Видеть список друзей
- Опционально: подтверждать друг другу результаты (buddy-verify в MVP-2)

### MVP-1 UI
- Кнопка «Invite link» генерит ссылку вида: /invite/{code}
- Экран «Invites»: входящие/исходящие
- Экран «Friends»: список, статус online (presence)

---

## 9) Техническая реализация (рекомендованный стек для Codex)
 (рекомендованный стек для Codex)

### Web
- Next.js (App Router)
- TypeScript
- Tailwind

### Backend
**Вариант A (быстро): Supabase**
- Auth
- Postgres
- Realtime (broadcast + presence)

**Вариант B (контроль): Node + WebSocket**
- Express/Fastify
- ws
- Postgres

> Для MVP-1: лучше Supabase ради скорости.

---

## 10) PWA
- manifest.json
- service worker
- install prompt
- (позже) web push: iOS требует установку на Home Screen.

---

## 11) План разработки (задачи для Codex)

### Sprint 1: Skeleton + Auth
- Next.js проект
- страницы: / (onboarding), /dashboard, /lobby, /room/[id], /profile, /leaderboards, /friends, /invites
- Supabase Auth (magic link или otp)
- Профиль пользователя: handle, age, gender, timezone, avatarSeed

### Sprint 2: Data + Schedule
- SQL migrations для таблиц (см. Entities)
- Seed дисциплин + 3–5 шаблонов комнат
- Генерация расписания на сутки (server action/cron) → scheduled_rooms
- Лобби: загрузка списка комнат (next 24h) + статус/таймер
- Dashboard: My Schedule (UserSchedule) + ближайшие комнаты

### Sprint 3: Realtime Room (Arena UI)
- Presence участников
- Broadcast increment events
- Snapshot состояния (для новых)
- Компоненты: RoomArena, AvatarGrid, FloatingDelta, RaidCounterPanel, IncrementControls
- Блок ScheduleStrip (today slots + week pattern)

### Sprint 4: Scoring + History
- На endAt: финализация сессии (resultValue)
- XP: attendance + sqrt(volume)
- Update user xpTotal, level
- Daily streak
- Sessions history

### Sprint 5 (MVP-1 polish)
- Leaderboards self (today/week)
- Achievements (10–15 простых)
- Invite links + Friends база (без buddy-verify пока)

### Sprint 6 (MVP-2)
- Buddy-verify таблица Verification
- Verified leaderboard
- Мягкая репутация

---

## 12) Чек-лист UX (важно)
- В комнате всегда видно: таймер, мой счёт, общий счёт.
- Кнопки инкремента крупные (большой палец).
- После комнаты — понятный экран результата: «Ты сделал X, получил Y XP, стрик Z».
- На Dashboard: «следующая комната» + 1 кнопка Join.

---

## 13) Что НЕ делаем в MVP-1
- Видео/голос (WebRTC)
- Сложный антифрод
- Полноценные сезоны/кланы
- Wearables

---

## 14) Промпты для Codex (шаблон)

**PROMPT 1 — Project bootstrap**
- Create Next.js (App Router) TS project with Tailwind.
- Add routes: / (onboarding), /dashboard, /lobby, /room/[id], /profile, /leaderboards, /friends, /invites.
- Implement layout + navigation.

**PROMPT 2 — Supabase schema**
- Provide SQL migrations for tables: users, disciplines, room_templates, scheduled_rooms, sessions, invites, friend_edges, user_schedules.
- Include indexes for leaderboards and queries.

**PROMPT 3 — Onboarding + user profile**
- Implement onboarding form: handle, age, gender.
- Persist to users table.
- Redirect to /dashboard.

**PROMPT 4 — Lobby + schedule**
- Fetch scheduled_rooms for next 24h.
- Render cards with countdown and participants count.

**PROMPT 5 — Realtime room arena**
- Implement presence + broadcast increment events.
- Maintain local state: participants, totals, per-user count.
- Add floating delta animation over avatar.
- Render schedule strip (today slots).

**PROMPT 6 — Scoring + streak**
- On room end, compute attendance, volume XP and update user xpTotal, level.
- Update daily streak.
- Store session history.

**PROMPT 7 — Invites + friends**
- Generate invite code links.
- Accept invite and create friend edge.
- Show friends list with online presence indicator.

---

# Appendix: Формулы уровней (простые)
- level = floor(sqrt(xpTotal / 100)) + 1

---

# Appendix: Мини-спека «Avatar Grid»
- Grid responsive: 4–6 columns on mobile
- Each avatar: circle 44–56px
- Display small label: current reps under avatar
- On popup: absolute positioned text rising animation

---

# 15) SQL (Supabase/Postgres) — миграции (готовый блок для Codex)

> Примечание: Supabase уже имеет auth.users. Ниже — app-таблицы.  
> В users храним app-профиль и связываем с auth.users через user_id UUID.

```sql
-- 001_init.sql

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (char_length(handle) between 3 and 20),
  avatar_seed text not null,
  timezone text not null,
  age smallint not null check (age between 13 and 120),
  gender text not null check (gender in ('male','female','other','prefer_not')),
  xp_total integer not null default 0,
  level integer not null default 1,
  reputation_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_xp_idx on public.profiles (xp_total desc);

create table if not exists public.disciplines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('strength','mobility','breath','mindfulness','recovery')),
  unit_type text not null check (unit_type in ('reps','minutes','sessions')),
  default_set_duration_sec integer not null,
  scoring_k integer not null default 3,
  created_at timestamptz not null default now()
);

create table if not exists public.room_templates (
  id uuid primary key default gen_random_uuid(),
  discipline_id uuid not null references public.disciplines(id) on delete cascade,
  title text not null,
  verification_mode text not null default 'self' check (verification_mode in ('self','buddy','host')),
  raid_goal integer,
  is_featured boolean not null default false,
  min_participants_to_start integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists room_templates_discipline_idx on public.room_templates(discipline_id);

create table if not exists public.scheduled_rooms (
  id uuid primary key default gen_random_uuid(),
  room_template_id uuid not null references public.room_templates(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming','live','finished','cancelled')),
  host_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists scheduled_rooms_start_idx on public.scheduled_rooms(start_at);
create index if not exists scheduled_rooms_template_idx on public.scheduled_rooms(room_template_id);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  scheduled_room_id uuid not null references public.scheduled_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  result_value integer not null default 0,
  xp_awarded integer not null default 0,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  verification_level text not null default 'self' check (verification_level in ('self','buddy','host')),
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_idx on public.sessions(user_id, created_at desc);
create index if not exists sessions_room_idx on public.sessions(scheduled_room_id);

create table if not exists public.user_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_template_id uuid not null references public.room_templates(id) on delete cascade,
  cadence text not null default 'daily' check (cadence in ('daily','weekly','custom')),
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
```

---

# 16) RLS (безопасность, минимум)

> Для MVP лучше включить RLS на всех таблицах и открыть только то, что нужно.

## 16.1 profiles
- пользователь может читать свой profile
- публично можно читать только handle + avatar_seed + level (без age/gender)

## 16.2 sessions
- пользователь может вставлять и читать свои sessions
- лидерборды читают агрегаты (через view) или через ограниченный select

> Codex: сделай отдельный файл `rls.sql` со всеми policy.

---

# 17) Views для лидербордов (упростить запросы)

```sql
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
```

---

# 18) API / Queries по экранам (чтобы Codex не фантазировал)

## 18.1 Onboarding
- create profile row for auth user
- fields: handle, age, gender, timezone, avatar_seed

## 18.2 Dashboard
- `GET my profile` (xp, level, streak, reputation)
- `GET my schedule templates` (user_schedules join room_templates join disciplines)
- `GET next upcoming rooms for my schedule` (next 6–12 часов)
- `GET achievements` (MVP-2)

## 18.3 Lobby
- `GET scheduled_rooms next 24h` with template + discipline + participants_count (presence)
- filter tabs:
  - Featured: templates is_featured=true
  - My Schedule: only templates in user_schedules
  - All: all

## 18.4 Room Live
- `GET scheduled_room by id` + template + discipline
- `GET today slots for this template` (room schedule strip) 
- Realtime:
  - presence list
  - increment events
  - room snapshot
- `POST session increment` (event)
- `POST finalize session` on end

## 18.5 Friends / Invites
- `POST create invite` → code
- `POST accept invite` → create friend_edge accepted
- `GET my friends` (handle, avatar, online)

---

# 19) Генератор расписания (раз в час, стандарт)

## 19.1 Правило
- Для каждого `room_template` создаём слоты на сутки: 24 слота.
- start_at = каждый час (00:00, 01:00, …) в таймзоне пользователя? 
  - MVP: расписание хранить в UTC, показывать локально.
- end_at = start_at + default_set_duration_sec + buffer (например 10 мин total)
  - Рекомендация: set duration 6 мин + post 2 мин + buffer 2 мин = 10 мин.

## 19.2 Как генерить
- Один раз в день генерить `scheduled_rooms` на следующие 48 часов, чтобы не было дыр.
- Генерация идемпотентная: если слот уже есть — пропускаем.

## 19.3 Псевдокод
```
for template in room_templates:
  for hour in next_48_hours_hourslots_utc:
    slotStart = floor_to_hour(hour)
    slotEnd = slotStart + template.defaultDuration (or discipline default)
    upsert scheduled_rooms(template, slotStart)
```

## 19.4 Где запускать
- MVP: server action при первом заходе в /lobby (lazy генерация)
- Лучше: cron (Supabase Scheduled Functions / external cron) раз в сутки

---

# 20) Realtime state model (чтобы не ломалось)

## 20.1 Room state
- `participants`: список user_id + handle + avatar_seed + current_value
- `room_total`
- `last_events` (кольцевой буфер 50 событий) — optional

## 20.2 Snapshot
- при подключении новый клиент запрашивает snapshot (HTTP) или получает broadcast snapshot
- затем слушает increment events

## 20.3 Presence
- в presence хранить `user_id`, `handle`, `avatar_seed`
- online friends: через presence channel friends (MVP позже)

---

# 21) UI: детали анимаций и визуала (минимализм)

## 21.1 AvatarChip
- круг 48px, внутри инициалы/паттерн
- под ним маленькое число (current_value)
- при increment — лёгкий scale pulse 1.0→1.06→1.0

## 21.2 FloatingDelta
- текст +N (например +20)
- появляется над аватаром, с opacity 1→0 и translateY 0→-28
- duration 750ms, easing out

## 21.3 RaidCounterPanel
- total count-up (анимация числа 200ms)
- progress bar плавно

---

# 22) Codex: как не упереться в токены (практическая стратегия)

## 22.1 Реальность
- Полноценный проект Codex может собрать, но только если:
  - давать задачи маленькими итерациями (файл/модуль за раз)
  - фиксировать структуру проекта и API заранее (в этом ТЗ)

## 22.2 Правила работы
- Никогда не просить «сделай весь проект целиком одним ответом».
- Делить по Sprint-ам: 1) bootstrap, 2) schema, 3) lobby, 4) realtime room, 5) scoring.
- В каждый запрос вставлять:
  - какие файлы создавать/менять
  - точный expected output
  - запрет на лишнюю болтовню

## 22.3 Если упираемся в контекст
- Работать «по файлам»: просить обновить конкретный файл.
- Просить выводить diff/patch.
- Держать этот ТЗ как «source of truth», а Codex — как исполнитель.

## 22.4 Что делать, если модель начинает «галлюцинировать»
- Возвращать к контракту: endpoints, schema, wireframes.
- Попросить написать тестовый сценарий (manual QA checklist) вместо новых фич.

---

# 23) QA чек-лист (ручной)
- Регистрация: handle/age/gender сохраняются, профиль создаётся.
- Dashboard: показывает XP/level/streak, ближайшую комнату.
- Lobby: таймеры корректны, статусы комнат меняются.
- Room: два телефона видят общий счёт синхронно, popups работают.
- End: XP начисляется, streak растёт 1 раз в день.
- Invites: ссылка создаётся, принимается, друг появляется.

---

# 24) Deployment (чтобы это реально жило)
- Front: Vercel
- Supabase project: env vars
- Cron: ежедневная генерация слотов (через Supabase Scheduled Functions или внешний cron)

---

# 25) Roadmap (после MVP-1)
- Buddy-verify + Verified leaderboards
- Reputation tiers
- Seasons + clans
- Host rooms
- Voice (не видео): один ведущий вещает
- Anti-surge / cooldown

---

# 26) Структура проекта (папки/файлы) 📦

> Цель: Codex работает по файлам, легко ориентируется, правки через diff/PR.

**Root**
- `SPEC.md` — это ТЗ (source of truth)
- `README.md` — как запускать
- `.env.example` — переменные окружения
- `sql/` — миграции
  - `001_init.sql`
  - `002_views.sql`
  - `rls.sql`

**Next.js (App Router)**
- `app/`
  - `layout.tsx` — общий layout + nav
  - `page.tsx` — onboarding (если не авторизован) / redirect
  - `dashboard/page.tsx`
  - `lobby/page.tsx`
  - `room/[id]/page.tsx`
  - `profile/page.tsx`
  - `leaderboards/page.tsx`
  - `friends/page.tsx`
  - `invites/page.tsx`
- `components/`
  - `arena/RoomArena.tsx`
  - `arena/RoomHeader.tsx`
  - `arena/RoomScheduleStrip.tsx`
  - `arena/RaidCounterPanel.tsx`
  - `arena/AvatarGrid.tsx`
  - `arena/AvatarChip.tsx`
  - `arena/FloatingDelta.tsx`
  - `arena/IncrementControls.tsx`
  - `arena/ProgramPanel.tsx`
  - `ui/` (кнопки, карточки, табы)
- `lib/`
  - `supabase/client.ts`
  - `supabase/server.ts`
  - `auth/guards.ts`
  - `schedule/generator.ts`
  - `realtime/roomChannel.ts`
  - `scoring/xp.ts`
  - `streaks/streaks.ts`
  - `avatars/avatarSeed.ts`
- `types/`
  - `db.ts` (типизация таблиц)
  - `realtime.ts` (контракты сообщений)
  - `programs.ts` (контракты программ)

---

# 27) Realtime: JSON-контракты сообщений 🛰️

> Эти контракты обязательны: Codex не должен изобретать форматы.

## 27.1 Каналы
- `room:{scheduled_room_id}` — presence + события комнаты
- (позже) `friends:{user_id}` — онлайн-друзья

## 27.2 Message Envelope
```json
{
  "type": "increment",
  "roomId": "uuid",
  "ts": "2026-02-14T12:34:56.000Z",
  "payload": {}
}
```

## 27.3 presence_sync (снимок присутствия)
```json
{
  "type": "presence_sync",
  "roomId": "uuid",
  "ts": "...",
  "payload": {
    "participants": [
      {"userId": "uuid", "handle": "nick", "avatarSeed": "seed", "currentValue": 40, "ready": false}
    ]
  }
}
```

## 27.4 room_state_snapshot (снимок состояния)
```json
{
  "type": "room_state_snapshot",
  "roomId": "uuid",
  "ts": "...",
  "payload": {
    "run": {
      "runId": "uuid",
      "status": "waiting",
      "startAt": null,
      "endAt": null,
      "programId": "uuid"
    },
    "roomTotal": 120,
    "participants": [
      {"userId": "uuid", "handle": "nick", "avatarSeed": "seed", "currentValue": 40, "ready": false}
    ]
  }
}
```

## 27.5 increment (клик +N)
```json
{
  "type": "increment",
  "roomId": "uuid",
  "ts": "...",
  "payload": {
    "runId": "uuid",
    "userId": "uuid",
    "delta": 10,
    "newUserValue": 50,
    "newRoomTotal": 130
  }
}
```

## 27.6 ready_toggle (готов/не готов)
```json
{
  "type": "ready_toggle",
  "roomId": "uuid",
  "ts": "...",
  "payload": {
    "runId": "uuid",
    "userId": "uuid",
    "ready": true
  }
}
```

## 27.7 run_start (старт программы)
```json
{
  "type": "run_start",
  "roomId": "uuid",
  "ts": "...",
  "payload": {
    "runId": "uuid",
    "startAt": "2026-02-14T12:00:10.000Z",
    "endAt": "2026-02-14T12:06:10.000Z",
    "programId": "uuid"
  }
}
```

## 27.8 run_end (конец)
```json
{
  "type": "run_end",
  "roomId": "uuid",
  "ts": "...",
  "payload": {
    "runId": "uuid",
    "endedAt": "..."
  }
}
```

---

# 28) Старт комнаты «вдвоём/втроём когда захотим» 🟢

## 28.1 Проблема
- Если ждать расписание и minimum участников — теряется импульс.

## 28.2 Решение (MVP-1)
В каждой комнате есть режим **Waiting → Ready → Start**.

### UI
- Кнопка: `I'm Ready` (toggle)
- Кнопка: `Start Now` (доступна если ты Ready)
- Статус: сколько участников Ready

### Правила старта (простые)
- Комнату можно стартовать **с любым количеством людей (≥1)**.
- Если в комнате несколько людей:
  - старт возможен когда **все текущие участники отметились Ready**
  - либо через **Manual Start** одним человеком: запускается 10-сек. обратный отсчёт, остальные могут нажать Ready и «подхватиться»
- Поздний вход: пользователь может зайти в уже начатый run и участвовать (у него будет меньше attendance).

### Технически
- Добавляем сущность `run` (может быть in-memory в realtime на MVP-1):
  - `runId`, `status(waiting|running|ended)`, `startAt`, `endAt`, `programId`
- После старта `startAt` становится фиксированным и единым для всех.

> Важно: Расписание каждый час остаётся (для «ритуала»), но есть и «старт по желанию».

---

# 29) «Программа» внутри комнаты (без ведущих) 🧠⏱️

> Цель: даже без модеров продукт ощущается как guided session: инструкции + интервалы + отдых.

## 29.1 Концепт: Program Engine
- У каждой комнаты есть `programId`.
- Program = список шагов (steps), которые идут по времени.
- UI показывает:
  - текущую команду (инструкция)
  - таймер шага
  - следующий шаг
  - общий таймер run

### ProgramStep (контракт)
- `type`: `prep | work | rest | breathe | hold | recover | guidance | finish`
- `durationSec`
- `title`
- `text` (короткая команда)

## 29.2 Program templates (MVP-1: 3 штуки)

### A) Push-ups (6 минут, интервалы)
- PREP 20s: «Плечи вниз, корпус ровный, дыхание спокойно»
- WORK 60s: «Делай отжимания. Считай и жми +10/+5/+1»
- REST 20s: «Отдых. Встряхни руки, вдох-выдох»
- WORK 60s
- REST 20s
- WORK 60s
- REST 20s
- WORK 60s
- REST 20s
- WORK 60s
- FINISH 20s: «Стоп. Запиши итог и восстанови дыхание»

> Примечание: структура 5 рабочих раундов по 60s + короткие отдыхи. Нормально для большинства.

### B) Meditation (6 минут)
- PREP 30s: «Сядь удобно. Спина ровно. Закрой глаза.»
- GUIDANCE 30s: «Внимание на дыхание. Вдох/выдох.»
- GUIDANCE 240s: «Если мысли уводят — мягко возвращайся к дыханию.»
- GUIDANCE 60s: «Скан тела: лицо, плечи, живот — расслабь.»
- FINISH 60s: «Открой глаза. Отметь сессию.»

### C) Wim Hof (упрощённо, 2 раунда — MVP)
> Важно: не давать медицинских обещаний. Безопасность: делать сидя/лёжа, не в воде, не за рулём.

- PREP 20s: «Сядь/ляг. Глубокий вдох, мягкий выдох.»
- BREATHE 90s: «30–40 ритмичных вдохов. Вдох полный, выдох расслабленный.»
- HOLD 60s: «Задержка на выдохе. Расслабься.»
- RECOVER 15s: «Глубокий вдох и удержание.»
- BREATHE 90s
- HOLD 60s
- RECOVER 15s
- FINISH 30s: «Дыши спокойно. Отметь сессию.»

> Позже: дать 3-й раунд и настраиваемые длительности.

## 29.3 UI: ProgramPanel
- сверху: текущий step title
- крупно: countdown step
- текст: команда
- снизу: next step preview

## 29.4 Ноты безопасности (MVP)
- Для дыхательных практик: предупреждение + чекбокс «понимаю» при первом входе.
- Для силовых: «делай по самочувствию, без боли».

---

# 30) Дополнение к расписанию комнаты (внутри Room)

## 30.1 Today slots
- В `RoomScheduleStrip` показывать ближайшие 6–8 слотов на сегодня (каждый час).
- Клик по времени → перейти в соответствующий scheduled_room.

## 30.2 Weekly view
- Пока как упрощённый индикатор: 7 дней с отметкой сколько раз заходил.

---

# 31) Codex Prompts (добавка под новые требования)

**PROMPT 8 — Project structure**
- Restructure project exactly as in section 26.
- Ensure imports updated.

**PROMPT 9 — Realtime contracts**
- Implement `types/realtime.ts` with message unions.
- Enforce usage in room channel.

**PROMPT 10 — Ready/Start flow**
- Add ready toggle per participant.
- Implement `run_start` with 10s countdown.
- Ensure late joiners receive snapshot.

**PROMPT 11 — Program engine**
- Implement `ProgramPanel` driven by program templates.
- Sync program step timing to run startAt.
- Provide 3 templates: Push-ups, Meditation, Wim Hof.

