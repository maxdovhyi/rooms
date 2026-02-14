# Ritual Rooms — Sprint 5 (MVP-1 polish)

Спринт 5 добавляет Self leaderboards, базовые ачивки, invite links и friends flow.

## Что реализовано
- **Leaderboards**
  - Страница `/leaderboards` с таблицами Today/Week.
  - SQL view-миграция для `leaderboard_today` и `leaderboard_week`.
- **Achievements (базовые)**
  - API `GET /api/achievements?userId=...`.
  - Dashboard показывает achievements-плитки (first session, 10 sessions, streak, XP цели).
- **Invites + Friends**
  - API `POST /api/invites/create` — генерирует invite code.
  - API `POST /api/invites/accept` — принимает код и создаёт accepted friend edge.
  - API `GET /api/friends?userId=...` — список друзей.
  - Страницы `/invites` и `/friends`.
- **Dashboard polish**
  - Ссылки на `/leaderboards`, `/friends`, `/invites`.
  - Показ streak, achievements, recent sessions.

## SQL / migrations
Примените по порядку:
1. `supabase/migrations/20260214120000_sprint2_data_schedule.sql`
2. `supabase/migrations/20260214170000_sprint4_scoring_history.sql`
3. `supabase/migrations/20260214190000_sprint5_polish.sql`
4. `supabase/migrations/20260214190500_sprint5_leaderboards_views.sql`
5. `sql/seed_sprint2.sql`

## Setup
1. `npm install`
2. `cp .env.example .env.local`
3. Заполните:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. `npm run dev`

## Sprint coverage
- Sprint 1: auth/onboarding/dashboard ✅
- Sprint 2: data + schedule + lobby ✅
- Sprint 3: realtime room arena ✅
- Sprint 4: scoring + history + streak ✅
- Sprint 5: leaderboards + achievements + invites/friends base ✅
