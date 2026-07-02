# VibeFocus

VibeFocus is an energy-aware productivity PWA for planning tasks, running deep-work sessions, auditing how work felt, and learning from personal productivity patterns.

## Features

- Google OAuth and email magic-link authentication through Supabase
- Quick tasks plus priority, due date, estimate, category, required energy, and recurrence planning
- Today planning with current-energy selection and deterministic focus suggestions
- Premium mobile bottom navigation, collapsible desktop sidebar, and contextual sync status
- Searchable Inbox, Today, Upcoming, Completed, and All task views with visible metadata
- Capability-gated Projects and Goals with offline/sync foundations
- Timestamp-restored focus timers and persistent focus-session history
- Accessible swipe, button, and keyboard-friendly energy auditing
- Persistent streak database model and task/focus/energy analytics foundations
- Dark, light, and system themes with account settings
- Bulk Import preview and server-only OpenAI-assisted structured import
- Installable PWA shell, offline fallback, IndexedDB mutation queue, and reconnect sync endpoint
- Browser notifications, web-push subscriptions, and Supabase Edge Function delivery
- Explicit RLS policies for every user-owned table

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Radix UI, Framer Motion, Recharts, Supabase, OpenAI, IndexedDB, Vitest, and Playwright.

## Local Setup

Requirements: Node.js 22+, npm, and a Supabase project or local Supabase CLI environment.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set the public Supabase URL and anonymous key before starting. Optional server-only variables enable AI import, push delivery, cron protection, and monitoring. Never expose `OPENAI_API_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`, or a Supabase service-role key to browser code.

## Database

The canonical database source is `supabase/migrations`. Back up production, link the Supabase CLI, then apply migrations in order:

```bash
supabase db push
```

Repository commands are also available as `npm run db:start`, `npm run db:reset`, `npm run db:lint`, and `npm run db:push`.

The foundation migration preserves task IDs, backfills legacy completion fields, converts legacy task energy values into audits, and enables RLS. See `docs/DATABASE_SCHEMA.md`.

## Validation

```bash
npm run typecheck
npm run lint
npm run test
npx playwright install chromium
npm run test:e2e
npm run test:db
npm run build
```

## PWA and Offline Testing

Service workers register only in production. Run `npm run build && npm run start`, open the app through localhost or HTTPS, confirm `/manifest.webmanifest` and `/sw.js`, then use browser developer tools to test offline reload and reconnect synchronization. Authenticated API responses are deliberately excluded from service-worker caching.

## Production Setup

Deploy the Next.js application to Vercel. Apply migrations and deploy `supabase/functions/send-reminders` and `supabase/functions/delete-account` to Supabase. Configure OAuth redirect URLs, magic-link redirect URLs, VAPID keys, the OpenAI key, Edge Function secrets, and a Supabase Cron schedule.

More detail:

- `AGENTS.md`: engineering rules and commands
- `docs/DATABASE_SCHEMA.md`: schema and migration strategy
- `docs/TESTING.md`: automated and manual testing
- `docs/DEPLOYMENT.md`: Vercel, Supabase, push, and external setup
- `docs/IMPLEMENTATION_PROGRESS.md`: current implementation status

## Known External Requirements

Applying production migrations, deploying Edge Functions, creating the Supabase Cron job, configuring OAuth, and supplying OpenAI/VAPID credentials require access to the repository owner’s external accounts.
