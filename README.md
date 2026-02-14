# Ritual Rooms — World + Palace + Big Profile (v1)

Добавлен слой “мира” поверх существующего MVP:

## Что добавлено

### 1) World Lobby (`/world`)
- 2D top-down карта (SVG + Tailwind, без тяжёлых движков).
- Движение игрока: WASD / стрелки.
- Здания:
  - 🏋️ Raid Gym
  - 🧘 Meditation Hall
  - 🫁 Wim Hof Lab
  - 🏛️ Challenge Palace
- Realtime presence-канал: `world:lobby`.
- Подсказки при подходе к зданию:
  - `E` = Enter
  - `Space` = Peek
- Peek overlay показывает inside-count и список игроков.
- Добавлены “боты” активности на карте (визуально похожи на игроков).

### 2) Challenge Palace (`/palace`)
- Создание challenge (`checkin` / `metric`) через API.
- Вход по invite-коду.
- Список активных challenge.
- Страница challenge: `/palace/challenge/[id]` с daily check-in и лентой событий.

### 3) Big Profile (`/profile`)
- Hero блок (ник, level, XP, быстрые входы в World/Lobby/Palace).
- Banks:
  - Meditation Minutes Bank
  - Reps Bank
  - Wim Hof cycles
- Achievements grid.
- Commitments (active challenges).
- Recent sessions log.

### 4) RoomScene/Room flow сохранены
- Существующая механика комнат не ломалась.
- Добавлены “боты” в комнату при низком онлайне для ощущения живой активности.

## Challenges DB/API (v1)

### Миграция
- `supabase/migrations/20260215001000_challenges_v1.sql`

### Таблицы
- `challenges`
- `challenge_members`
- `challenge_checkins`
- `challenge_events`

### API
- `POST /api/challenges/create`
- `POST /api/challenges/invite`
- `POST /api/challenges/accept`
- `POST /api/challenges/checkin`
- `GET /api/challenges/list`
- `GET /api/challenges/:id`

Все challenge endpoints используют server-side auth через `Authorization: Bearer <access_token>` и отвечают в формате `{ ok: true|false, ... }`.

## Навигация
- После онбординга и continue-флоу основной вход теперь в `/world`.
- Dashboard содержит большую кнопку **Enter World**.

## Setup
1. `npm install`
2. `cp .env.example .env.local`
3. Заполнить env:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. `npm run dev`
