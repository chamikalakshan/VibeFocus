# Testing

Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`, `npm run test:db`, and `npm run build`.

E2E tests require valid test Supabase credentials and a test user. Validate RLS with two separate authenticated users before production rollout. PWA testing requires a production build served over HTTPS or localhost.

The production dependency audit currently reports two moderate findings caused by Next.js bundling a vulnerable PostCSS version. The high-severity Next.js findings were removed by upgrading to `16.2.9`; npm currently proposes an invalid downgrade to Next.js 9 as the only automatic remediation, so do not run `npm audit fix --force`.

Database migration validation requires Docker Desktop. Start Docker, then run `npm run db:start`, `npm run db:reset`, `npm run db:lint`, and `npm run test:db`. The latest attempt was blocked because the Docker daemon was unavailable.
