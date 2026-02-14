# Ritual Rooms — Sprint 1 MVP

MVP-минимум по `spec.md`: skeleton + auth + onboarding + dashboard.

## Что реализовано
- Next.js (App Router) + TypeScript + Tailwind
- Маршруты:
  - `/` — логин/регистрация через Supabase magic link + кнопка Continue
  - `/onboarding` — форма handle/age/gender + auto timezone и upsert в `public.profiles`
  - `/dashboard` — отображение `handle`, `xp_total`, `level`, `streak`
  - `/lobby` — список комнат из `room_templates`
  - `/room/[id]` — каркас комнаты с кнопкой Start

## Локальный запуск
1. Установите зависимости:
   ```bash
   npm install
   ```
2. Создайте `.env.local` на основе примера:
   ```bash
   cp .env.example .env.local
   ```
3. Заполните переменные Supabase в `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Запустите dev-сервер:
   ```bash
   npm run dev
   ```
5. Откройте http://localhost:3000

## Проверка потока
1. На `/` введите email и отправьте magic link.
2. После логина нажмите `Continue`.
3. Если профиль отсутствует в `public.profiles`, откроется `/onboarding`.
4. Заполните форму, после upsert произойдет редирект на `/dashboard`.
