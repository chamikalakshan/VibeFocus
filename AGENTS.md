# VibeFocus Engineering Guide

VibeFocus is a Next.js App Router PWA backed by Supabase. Product flow: plan a task, focus, complete it, audit its energy result, then review analytics.

## Commands

- `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`, `npm run test:db`, `npm run build`
- Apply ordered SQL files in `supabase/migrations`; never edit production tables manually.

## Architecture

- `app/`: routes and server boundaries
- `components/`: interactive UI
- `lib/domain/`: pure, tested product rules
- `utils/supabase/`: authenticated clients
- `supabase/migrations/`: canonical schema and RLS

Derive user IDs from authenticated sessions. Keep secrets server-only. Validate all boundaries. Never disable RLS or introduce a second task completion representation. Required task energy is low/medium/high; audit results are energizing/neutral/draining.

Definition of done: migrations preserve data, typecheck/lint/tests/build pass, workflows are keyboard/mobile accessible, documentation is current, and no secrets are committed.
