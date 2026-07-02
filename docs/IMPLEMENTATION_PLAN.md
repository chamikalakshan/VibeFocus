# Implementation Plan

Implement in dependency order: baseline and CI; canonical migrations/RLS; typed server data boundaries; persistent streaks/sessions/settings; PWA/offline/push; planning/Today/audits/AI; analytics/accessibility/full validation.

Every phase must finish with typecheck, lint, tests, build, and an update to `IMPLEMENTATION_PROGRESS.md`.

## Phase 2 Security Completion

Phase 2 hardens every user-owned table with operation-specific RLS, server-derived ownership, same-owner relationship triggers, least-privilege grants, account-partitioned offline queues, protected-route tests, and a cross-user SQL policy suite.
