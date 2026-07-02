# Database Schema

The only canonical schema is the ordered SQL in `supabase/migrations`.

Core user-owned tables are `tasks`, `projects`, `goals`, `user_settings`, `focus_sessions`, `task_energy_audits`, `energy_checkins`, `user_stats`, `push_subscriptions`, `processed_mutations`, and `ai_import_usage`. Every table has RLS policies limiting access to `auth.uid() = user_id`.

Task completion uses `tasks.status` plus `completed_at`. Energy auditing is stored separately and uses `energizing`, `neutral`, or `draining`.

The additive Phase 1 migration creates Projects and Goals and adds nullable `project_id` and `goal_id` task relationships. The UI checks `/api/schema/capabilities` and does not query these tables until the migration is available.

The Phase 2 security-hardening migration recreates explicit operation-specific RLS policies for all user-owned tables, revokes access to internal trigger functions, and prevents cross-user foreign-key relationships. See `docs/SECURITY.md`.

The Supabase CLI is installed as a repository dependency and configured in `supabase/config.toml`.

Validate locally with Docker before touching a hosted project:

```bash
npm run db:start
npm run db:reset
npm run db:lint
npm run test:db
```

Then take a production backup, link the intended project with `npx supabase link --project-ref <ref>`, inspect `npx supabase db push --dry-run`, and apply with `npm run db:push`. The foundation migration backfills old completion and energy values without changing task IDs.
