# Deployment

Deploy the Next.js app to Vercel and the database/functions to Supabase.

1. Back up production data.
2. Install Docker and validate locally with `npm run db:start`, `npm run db:reset`, `npm run db:lint`, and `npm run test:db`.
3. Link the Supabase CLI, inspect `npx supabase db push --dry-run`, and apply `supabase/migrations` in order with `npm run db:push`.
4. Configure all variables listed in `.env.example`; secrets must remain server-side.
5. Configure Google OAuth and magic-link redirect URLs.
6. Deploy Edge Functions and schedule reminder delivery with Supabase Cron.
7. Deploy to Vercel, then validate auth, RLS, manifest, service worker, offline fallback, and push.
8. Run `npm run verify:hosted-privacy`; it must report every canonical table as isolated or denied, with no missing or exposed tables.

Required Edge Function secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, and `VAPID_PRIVATE_KEY`. Invoke `send-reminders` from Supabase Cron with `Authorization: Bearer <CRON_SECRET>`. The service-role key belongs only in Supabase Edge Function secrets.
