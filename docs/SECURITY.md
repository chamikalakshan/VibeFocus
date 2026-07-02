# Security and Data Privacy

VibeFocus uses Supabase authentication, server-derived ownership, Row Level Security, and database relationship checks as independent layers.

## Ownership Boundary

- Browser task operations call `/api/tasks`; the route derives the user from `supabase.auth.getUser()`.
- Server actions and protected API routes derive `user.id` from the authenticated cookie session.
- Client input never controls persisted `user_id` values.
- IndexedDB records and queued mutations are partitioned by local account; legacy unowned mutations are never synced under a later session.
- The browser receives only the public Supabase URL and anonymous key. The service-role key is restricted to deployed Supabase Edge Function secrets.

## Row Level Security

Every user-owned table has RLS enabled and explicit authenticated-role policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`:

`tasks`, `projects`, `goals`, `user_settings`, `focus_sessions`, `task_energy_audits`, `energy_checkins`, `user_stats`, `push_subscriptions`, `processed_mutations`, and `ai_import_usage`.

Each policy requires `auth.uid() = user_id`. The security-hardening migration also rejects cross-owner relationships for task recurrence parents, projects, goals, focus sessions, and audits.

Internal statistics, relationship, and timestamp trigger functions are not executable by `public`, `anon`, or `authenticated`.
Anonymous table privileges are revoked, authenticated users receive only the CRUD privileges required for RLS evaluation, and automatic exposure of future tables is disabled in local Supabase configuration.
If an upgraded hosted project still retains the legacy `energy_logs` table, the migration conditionally applies the same explicit policies and grants without creating the table on clean installations.

## Verification

Run against a disposable local Supabase database:

```bash
npm run db:start
npm run db:reset
npm run db:lint
npm run test:db
```

`supabase/tests/rls.sql` creates User A and User B records for every user-owned table, authenticates as User A, and verifies that User B rows cannot be read, inserted, updated, or deleted.

Application boundary checks are also covered by `npm run test` and `npm run test:e2e`.

After local migration validation and deployment, run the read-only hosted audit:

```bash
npm run verify:hosted-privacy
```

This confirms every canonical table exists and that an anonymous REST request cannot return row data. It does not replace the two-user SQL policy suite.

Expected pre-deployment failure on the current hosted legacy schema: `tasks` is isolated, while the other canonical user-owned tables are reported as missing. Do not apply migrations to that hosted project until `db:reset`, `db:lint`, and `test:db` pass against a disposable database.

Never run database policy tests against a hosted production database.
