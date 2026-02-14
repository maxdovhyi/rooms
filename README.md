# Ritual Rooms — Sprint 2 (Data + Schedule)

Спринт 2 реализует данные и расписание комнат из `spec.md`:
- миграции БД (profiles, disciplines, room_templates, scheduled_rooms)
- seed SQL для дисциплин и шаблонов комнат
- API-генератор расписания на 24–48 часов (идемпотентно)
- `/lobby` показывает ближайшие `scheduled_rooms` на 24 часа

## Что реализовано
- `supabase/migrations/20260214120000_sprint2_data_schedule.sql`
  - Таблицы: `profiles`, `disciplines`, `room_templates`, `scheduled_rooms`
  - `room_templates` включает: `title`, `verification_mode`, `is_featured`, `created_at`
  - `scheduled_rooms` содержит `template_id` + CHECK статус (`scheduled|running|ended|cancelled`)
  - Индексы для основных запросов
  - RLS + политики SELECT для `anon` и `authenticated` на `room_templates` и `scheduled_rooms`
- `sql/seed_sprint2.sql`
  - 3 дисциплины: Push-ups, Meditation, Wim Hof
  - 5 шаблонов комнат (идемпотентный upsert)
- `POST /api/schedule/generate`
  - Генерирует почасовые `scheduled_rooms`
  - По умолчанию: 24 часа, можно передать `hours` (1..48)
  - Идемпотентность через `upsert` + уникальность `(template_id, start_at)`
- `/lobby`
  - Показывает комнаты на ближайшие 24 часа
  - Отображает: `template title`, `status`, countdown до старта

## Setup
1. Установите зависимости:
   ```bash
   npm install
   ```
2. Создайте env-файл:
   ```bash
   cp .env.example .env.local
   ```
3. Заполните переменные:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (нужен для API-генератора)
4. Запустите проект:
   ```bash
   npm run dev
   ```

## Применение SQL (Supabase)
1. Примените миграцию `supabase/migrations/20260214120000_sprint2_data_schedule.sql`.
2. Выполните seed `sql/seed_sprint2.sql`.

## Запуск генератора расписания
### Вариант 1: 24 часа (по умолчанию)
```bash
curl -X POST http://localhost:3000/api/schedule/generate
```

### Вариант 2: 48 часов
```bash
curl -X POST http://localhost:3000/api/schedule/generate \
  -H "Content-Type: application/json" \
  -d '{"hours":48}'
```

Пример ответа:
```json
{
  "inserted": 120,
  "templates": 5,
  "hours": 24
}
```
