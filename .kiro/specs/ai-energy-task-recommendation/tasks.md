# Implementation Plan: AI Energy Task Recommendation

## Overview

Extend VibeFocus with an AI-powered task recommendation engine that learns from a user's energy audit history. The work proceeds in strict layers: database → domain types → pure engine logic → API route → UI component → today-view integration → cache invalidation → docs. No existing tables, routes, or domain functions are modified.

## Tasks

- [ ] 1. Database migration — `ai_recommendation_cache` table
  - [ ] 1.1 Create migration file `supabase/migrations/202606140001_ai_recommendation_cache.sql`
    - Define the `ai_recommendation_cache` table: `user_id uuid primary key`, `cache_key text`, `payload jsonb`, `generated_at timestamptz`, `updated_at timestamptz`
    - Add `on delete cascade` FK to `auth.users`
    - Enable RLS; add four policies: `own_select`, `own_insert`, `own_update`, `own_delete`, all scoped to `auth.uid() = user_id`
    - `revoke all … from public, anon, authenticated` then `grant select, insert, update, delete … to authenticated`
    - Attach `set_updated_at` trigger on `before update`
    - Add `generated_at desc` index
    - _Requirements: 7.1, 9.1, 9.2_
  - [ ]* 1.2 Run `npm run test:db` and `supabase db lint --level warning` to verify the migration applies cleanly and all four RLS policies are present
    - _Requirements: 9.2_

- [ ] 2. TypeScript domain types
  - [ ] 2.1 Add new types to `lib/domain/types.ts`
    - `ConfidenceLevel = "low" | "medium" | "high"`
    - `Recommendation { task: Task; score: number; confidence: ConfidenceLevel; reason: string }`
    - `RecommendationResponse { recommendations: Recommendation[]; cold_start: boolean; generated_at: string }`
    - `AuditRecord { taskId: string; category: string | null; required_energy: RequiredEnergy | null; priority: Priority; rating: EnergyRating; auditedAt: string }`
    - `ScoredTask { task: Task; score: number; affinityScore: number; energyAlignment: number; priorityScore: number; urgencyScore: number; matchingAuditCount: number; confidence: ConfidenceLevel }`
    - `RecommendationInput { pendingTasks: Task[]; auditHistory: AuditRecord[]; currentEnergy: RequiredEnergy; now?: Date }`
    - _Requirements: 4.1, 5.1, 6.2, 8.3_
  - [ ]* 2.2 Run `npm run typecheck` to confirm no type errors are introduced
    - _Requirements: 4.1_

- [ ] 3. Recommendation_Engine pure functions
  - [ ] 3.1 Create `lib/domain/recommendation.ts` with all four exported functions
    - `resolveCurrentEnergy(level: number | null): RequiredEnergy` — `null` or missing → `"medium"`; 1–2 → `"low"`; 3 → `"medium"`; 4–5 → `"high"`
    - `computeAffinityScore(matchingAudits: AuditRecord[], allAffinityScores: number[]): number` — partition into most-recent-20 (weight 1.5×) and older (weight 1.0×); `+2 energizing`, `0 neutral`, `-1 draining`; normalise across `allAffinityScores` to [0, 100]
    - `buildLocalRationale(scored: ScoredTask, currentEnergy: RequiredEnergy): string` — deterministic one-sentence string ≤ 120 chars based on composite score factors and confidence level
    - `scoreAndRankTasks(input: RecommendationInput, limit = 10): ScoredTask[]` — implements the full composite formula: `0.4×affinityNorm + 0.3×energyAlignment + 0.2×priorityScore + 0.1×urgencyScore`; energy alignment table, priority table, urgency buckets, confidence thresholds, tie-break by `created_at` asc; filters to `status = "pending"` only; returns at most `limit` items
    - No imports from Supabase, Next.js, or OpenAI
    - _Requirements: 1.1–1.4, 2.1–2.4, 4.1–4.5, 5.1–5.3, 11.3, 11.4_
  - [ ]* 3.2 Write unit tests in `lib/domain/recommendation.test.ts`
    - `resolveCurrentEnergy`: null → `"medium"`; level 2 → `"low"`; level 4 → `"high"`
    - Priority score mapping: `low → 10`, `medium → 30`, `high → 60`
    - Urgency score buckets: overdue, < 24 h, < 72 h, no due date, boundary values at exactly 24 h and 72 h
    - Cold start: audit counts 0, 1, 2 → delegates to `rankTodayTasks` (tested at the API layer); engine returns empty array
    - Non-pending tasks are not present in output
    - `buildLocalRationale` returns a string ≤ 120 chars for each confidence level
    - Cache key is deterministic for identical inputs
    - _Requirements: 1.1–1.4, 2.1–2.3, 4.2, 4.3, 4.5, 5.1–5.3_
  - [ ]* 3.3 Install `fast-check` dev dependency and write property tests in `lib/domain/recommendation.property.test.ts`
    - Run `npm install --save-dev fast-check` first; confirm it appears in `package.json` devDependencies
    - Each test tagged `// Feature: ai-energy-task-recommendation, Property N: <property_text>`; minimum 100 runs per property
    - **Property 1** — Affinity aggregation: generate arbitrary audit arrays and candidate task; assert raw score equals manual weighted sum
    - **Property 2** — Normalisation range: generate ≥ 1 tasks with random raw scores; assert all normalised values ∈ [0, 100] and relative ordering preserved
    - **Property 3** — Energy alignment lookup: generate all 9 `currentEnergy × required_energy` pairs; assert each matches the specification table exactly
    - **Property 4** — Cold start branching: generate audit count 0–10; assert `cold_start === auditCount < 3` (use engine's cold-start detection logic in isolation)
    - **Property 5** — Composite formula: generate four independent component values; assert composite equals `0.4a + 0.3e + 0.2p + 0.1u`
    - **Property 6** — Output invariant: generate 0–50 tasks; assert output tasks are all `status = "pending"`, ordered by composite desc (ties by `created_at` asc), and length ≤ 10
    - **Property 7** — Confidence threshold: generate arbitrary `matchingAuditCount`; assert level is `"high"` ≥ 10, `"medium"` 3–9, `"low"` < 3
    - **Property 8** — Rationale length: generate arbitrary `ScoredTask`; assert `buildLocalRationale(scored, energy).length <= 120`
    - **Property 9** — Prompt safety: generate arbitrary scored tasks; assert constructed prompt contains no task UUID or user UUID
    - **Property 10** — Recency weighting: generate audit history with controlled recent-20 / older split; assert raw score equals `1.5 × recentSum + 1.0 × olderSum`
    - _Requirements: 1.1–1.4, 2.1–2.3, 4.1, 4.4, 4.5, 5.1–5.3, 6.1, 9.4, 11.3, 11.4_
  - [ ] 3.4 Checkpoint — run `npm run test` to confirm all domain unit and property tests pass
    - _Requirements: all Req 1–5, 11_

- [ ] 4. Recommendation_API route
  - [ ] 4.1 Create `app/api/ai/recommend/route.ts` with a `GET` handler
    - Authenticate via `createClient()` from `@/utils/supabase/server`; return 401 for missing session
    - Parse and validate optional `?energy=low|medium|high` query param; return 400 with descriptive message on invalid value
    - Compute `cache_key = sha256(sortedPendingTaskIds + "|" + energyLevel + "|" + auditCount)` using Node.js `crypto` module
    - Check `ai_recommendation_cache`; if `cache_key` matches and `generated_at` is < 15 min ago, return cached payload with `X-Cache: HIT` header
    - Fetch in parallel: `tasks` (status = pending), `task_energy_audits` (all for user), `energy_checkins` (most recent within 12 h)
    - Call `resolveCurrentEnergy` on the check-in level; override with query param when both a valid param and a recent check-in exist
    - Cold start path (audit count < 3): call `rankTodayTasks`, build `RecommendationResponse` with `cold_start: true`, skip OpenAI, write to cache, return with `X-Cache: MISS`
    - Scoring path: call `scoreAndRankTasks`, take top 5 for OpenAI prompt
    - Rate-limit check via `ai_import_usage` table (same rolling-hour pattern as `app/api/ai/import/route.ts`); if quota met → skip to local rationale
    - If `OPENAI_API_KEY` is unset → skip to local rationale
    - OpenAI call: `gpt-4.1-mini`, structured prompt with anonymised task data only (title, category, required_energy, priority — no IDs), 5000 ms `AbortController` timeout; on timeout or error → fall back to `buildLocalRationale`, log server-side, do not surface error to client
    - Upsert result to `ai_recommendation_cache`; on cache write failure → log warning, still return result
    - Return JSON `RecommendationResponse` with `X-Cache: MISS`
    - _Requirements: 6.1–6.5, 7.1–7.4, 8.1–8.5, 9.1, 9.3, 9.4_
  - [ ]* 4.2 Write integration tests in `app/api/ai/recommend/route.test.ts`
    - Mock Supabase client and OpenAI client (mirror pattern from import route tests if any exist, otherwise use `vi.mock`)
    - 401 when session is absent
    - 400 when `?energy=invalid`
    - 429 when `ai_import_usage` count ≥ 10 — test that local rationale is used and no error is returned to client
    - `X-Cache: HIT` when cache entry is < 15 min old with matching key
    - `X-Cache: MISS` on first call; second call within 15 min returns `HIT`
    - `cold_start: true` in response when audit count < 3; shape matches `RecommendationResponse`
    - Local rationale path: verify no OpenAI call when `OPENAI_API_KEY` is unset
    - OpenAI timeout path: verify `AbortController` fires at 5 s and local rationale is used
    - _Requirements: 6.3, 6.4, 6.5, 7.2, 7.4, 8.2, 8.4, 9.4_
  - [ ] 4.3 Checkpoint — run `npm run test` and `npm run typecheck` to confirm route compiles and all API tests pass

- [ ] 5. RecommendationCard sub-component
  - [ ] 5.1 Create `components/features/RecommendationCard.tsx`
    - Props: `{ task: Task; score: number; confidence: ConfidenceLevel; reason: string; onFocus: () => void }`
    - Render task title, confidence badge, and reason text
    - Entire card is keyboard-focusable and clickable; `onClick` / `onKeyDown(Enter/Space)` → call `onFocus`
    - Match existing card styling patterns in the project (Tailwind, no new UI libraries)
    - _Requirements: 10.1, 10.6_

- [ ] 6. RecommendationPanel component
  - [ ] 6.1 Create `components/features/RecommendationPanel.tsx`
    - `"use client"` directive
    - On mount, `fetch('/api/ai/recommend')` (optionally append `?energy=` from context if check-in is available)
    - Five render states:
      1. **No check-in**: prompt card — "Log your energy to unlock personalised recommendations" with link to energy selector
      2. **Loading**: 3 × `<Skeleton>` card placeholders (exactly 3, while fetch is in-flight)
      3. **Cold start** (`cold_start: true`): info card — "Building your energy profile — complete more tasks to unlock personalised suggestions."
      4. **Loaded**: top 3 `RecommendationCard` instances from `data.recommendations`
      5. **Error**: inline muted error message; no full-page disruption, sibling sections unaffected
    - On card `onFocus` callback: call `setActiveTaskId(task.id)` from `useVibe()`, then `router.push('/dashboard/focus')`
    - _Requirements: 10.1–10.6_
  - [ ]* 6.2 Write component tests in `components/features/RecommendationPanel.test.tsx`
    - Use Vitest + Testing Library, mirroring `ActiveFocusMode.test.tsx` patterns
    - Mock `useVibe` and `fetch` (or the API module)
    - Skeleton: 3 skeleton elements render while fetch is pending
    - Cold start: "Building your energy profile" message displays when `cold_start: true`
    - Loaded: top 3 recommendation cards render with title and reason text
    - No check-in: energy-prompt card is shown (not loading skeletons, not recommendations)
    - Error: inline error message appears; no full-page disruption
    - Card click: `setActiveTaskId` is called with the correct task ID and router is pushed to `/dashboard/focus`
    - _Requirements: 10.1–10.6_
  - [ ] 6.3 Checkpoint — run `npm run test` and `npm run typecheck` to confirm all component tests pass

- [ ] 7. Today view integration
  - [ ] 7.1 Slot `RecommendationPanel` into the today view without modifying `TodayView.tsx`'s existing layout
    - Identify the correct location: `app/dashboard/today/page.tsx` renders `<TodayView />`; add `<RecommendationPanel />` as a sibling below `<TodayView />` wrapped in a `<section>` with an appropriate accessible label
    - Alternatively, if the design calls for it inside the today section, add it as an adjacent element inside the page component — never modify `TodayView.tsx` internals
    - Confirm the panel does not break mobile layout or keyboard navigation
    - _Requirements: 10.1, 10.5_
  - [ ] 7.2 Checkpoint — run `npm run typecheck` and `npm run lint`; do a visual smoke-check that `/dashboard/today` loads without errors and panel is visible

- [ ] 8. Cache invalidation on audit submission
  - [ ] 8.1 Add cache invalidation to `actions/energy.ts` (or the relevant server action that calls `task_energy_audits` insert)
    - After a successful audit submission, call `supabase.from("ai_recommendation_cache").delete().eq("user_id", user.id)` to remove the stale cache row
    - The `cache_key` hash (which embeds `auditCount`) will also produce a mismatch on next load, so the DELETE is a belt-and-suspenders guard
    - Do not change the audit submission logic or its return shape
    - _Requirements: 11.1, 11.2_
  - [ ]* 8.2 Write a unit/integration test asserting that a successful audit submission triggers the cache delete call (mock Supabase client)
    - _Requirements: 11.1, 11.2_
  - [ ] 8.3 Checkpoint — run `npm run test` and `npm run typecheck`; confirm no regressions in existing energy actions tests

- [ ] 9. Final validation
  - [ ] 9.1 Run the full validation suite: `npm run typecheck && npm run lint && npm run test && npm run build`
    - Resolve any type errors, lint warnings, or test failures before proceeding
    - _Requirements: all_
  - [ ] 9.2 Update `README.md` (or relevant docs) to document the new endpoint `GET /api/ai/recommend`, the `ai_recommendation_cache` table, the rate-limit behaviour, and the cold-start threshold
    - _Requirements: documentation — definition of done per AGENTS.md_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; core scoring and API will function with local rationale only
- Checkpoints at tasks 3.4, 4.3, 6.3, 7.2, and 8.3 ensure incremental validation — run them before moving to the next task group
- `fast-check` must be installed (task 3.3) before property tests can be written; if skipping that sub-task, also skip the `fast-check` install step
- `ai_import_usage` is reused for rate limiting — do not create a separate rate-limit table
- The `Recommendation_Engine` (`lib/domain/recommendation.ts`) must remain a pure function with zero I/O; all database access stays in the API route
- Cache invalidation relies on both the `auditCount` hash mismatch and the explicit DELETE; either mechanism alone is sufficient, but both together are defensive
- The `set_updated_at` trigger referenced in the migration must already exist in the schema (it is created in an earlier migration); if not present, add it to the migration file

## Task Dependency Graph

```json
{
  "waves": [
    ["1"],
    ["2"],
    ["3"],
    ["4", "5"],
    ["6", "8"],
    ["7"],
    ["9"]
  ]
}
```

- Task 1 must precede all others (schema must exist for RLS tests and API route to reference the table).
- Task 2 must precede Task 3 (engine imports the new types).
- Task 3 must precede Task 4 (API route calls engine functions).
- Task 5 must precede Task 6 (panel composes the card).
- Tasks 4 and 6 can progress in parallel once Task 3 is complete.
- Task 7 depends on Task 6 (panel must exist to slot in).
- Task 8 is independent of Tasks 5–7 and can be done any time after Task 1.
- Task 9 depends on all preceding tasks.
