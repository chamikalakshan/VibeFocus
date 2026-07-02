# Requirements Document

## Introduction

VibeFocus already uses a deterministic scoring algorithm (`rankTodayTasks`) to suggest tasks based on priority, due dates, and required energy level. This feature replaces and extends that foundation with an AI-powered recommendation system that also incorporates a user's historical energy audit data.

The system will analyze patterns from `task_energy_audits` (how completed tasks felt: energizing/neutral/draining), `energy_checkins` (the user's logged energy level at a point in time), and task metadata to produce a personalised, ranked recommendation list. The AI learns over time as more audit data accumulates and falls back to the deterministic algorithm for new users with insufficient history.

The system is server-side, secrets-safe, and fully integrated into the existing VibeFocus architecture (Next.js App Router, Supabase, OpenAI).

---

## Glossary

- **Recommendation_Engine**: The server-side module (`lib/domain/recommendation.ts`) containing pure logic for scoring and ranking tasks using audit history.
- **Recommendation_API**: The Next.js API route (`app/api/ai/recommend/route.ts`) that orchestrates data fetching, calls the Recommendation_Engine, and optionally calls OpenAI for narrative context.
- **Audit_History**: The set of records in `task_energy_audits` for a given user, each associating a completed task with an `EnergyRating` (`energizing`, `neutral`, or `draining`).
- **Energy_Checkin**: A record in `energy_checkins` representing a user's self-reported energy level (1–5 scale) at a specific moment.
- **Current_Energy**: The user's most recent `Energy_Checkin` level, translated to the `RequiredEnergy` enum (`low` = 1–2, `medium` = 3, `high` = 4–5).
- **Affinity_Score**: A per-category or per-task numeric score derived from Audit_History that quantifies how energizing a task type has historically been for a user.
- **Recommendation**: A ranked `Task` record accompanied by a plain-language reason string and a confidence level (`low`, `medium`, or `high`).
- **Cold_Start**: The state when a user has fewer than 3 audit records, triggering a fallback to the deterministic `rankTodayTasks` algorithm.
- **Recommendation_Cache**: The `ai_recommendation_cache` Supabase table that stores the most recent recommendation results per user to reduce OpenAI call frequency.
- **Rate_Limit_Window**: A rolling 60-minute window used to cap OpenAI calls per user, consistent with the pattern in `ai_import_usage`.

---

## Requirements

### Requirement 1: Audit-Driven Affinity Scoring

**User Story:** As a VibeFocus user, I want the recommendation system to learn from my past energy audits, so that tasks matching my historically energizing patterns are surfaced first.

#### Acceptance Criteria

1. THE Recommendation_Engine SHALL compute an Affinity_Score for each pending task by aggregating the `EnergyRating` values from Audit_History records whose tasks share the same `category`, `required_energy`, or `priority` as the candidate task.
2. WHEN computing the Affinity_Score, THE Recommendation_Engine SHALL assign `+2` for each `energizing` rating, `0` for each `neutral` rating, and `-1` for each `draining` rating from matching Audit_History records.
3. WHEN a candidate task has no matching Audit_History records, or WHEN the computed raw score across matching records equals zero, THE Recommendation_Engine SHALL assign that task an Affinity_Score of `0`.
4. THE Recommendation_Engine SHALL normalise Affinity_Scores to a `[0, 100]` range before combining them with other scoring factors, and SHALL clamp any value that falls outside this range to exactly `0` or `100` after normalisation.

---

### Requirement 2: Current Energy Alignment

**User Story:** As a VibeFocus user, I want recommendations to consider my energy right now, so that I am not assigned high-energy tasks when I am running low.

#### Acceptance Criteria

1. WHEN the Current_Energy is `low`, THE Recommendation_Engine SHALL apply a bonus of `+30` to tasks whose `required_energy` is `low` and a penalty of `-20` to tasks whose `required_energy` is `high`.
2. WHEN the Current_Energy is `medium`, THE Recommendation_Engine SHALL apply a bonus of `+15` to tasks whose `required_energy` is `medium` and no adjustment to tasks with `required_energy` of `low` or `high`.
3. WHEN the Current_Energy is `high`, THE Recommendation_Engine SHALL apply a bonus of `+30` to tasks whose `required_energy` is `high` and a penalty of `-10` to tasks whose `required_energy` is `low`.
4. WHEN no Energy_Checkin exists for the authenticated user within the past 12 hours, THE Recommendation_Engine SHALL treat Current_Energy as `medium`, overriding any previously stored energy level or any `energy` query parameter value.

---

### Requirement 3: Cold Start Fallback

**User Story:** As a new VibeFocus user, I want to receive useful task suggestions even before I have built up an energy audit history, so that the system is helpful from day one.

#### Acceptance Criteria

1. WHEN a user has fewer than 3 records in Audit_History, THE Recommendation_API SHALL return recommendations produced by the existing `rankTodayTasks` deterministic algorithm instead of the AI scoring path.
2. WHEN the Cold_Start fallback is active, THE Recommendation_API SHALL include a `cold_start: true` flag in the response payload.
3. WHEN a user's Audit_History grows to 3 or more records, THE Recommendation_API SHALL automatically switch to AI-powered scoring on the next request without requiring any user action.

---

### Requirement 4: Final Composite Score and Ranking

**User Story:** As a VibeFocus user, I want recommendations to balance my energy patterns, current state, urgency, and priority together, so that the most contextually appropriate task always appears first.

#### Acceptance Criteria

1. THE Recommendation_Engine SHALL compute a composite score for each pending task as: `Affinity_Score (normalised, weight 40%) + Current_Energy_Alignment (weight 30%) + Priority_Score (weight 20%) + Urgency_Score (weight 10%)`.
2. THE Recommendation_Engine SHALL derive `Priority_Score` from the task's `priority` field using the values: `low = 10`, `medium = 30`, `high = 60`, consistent with the existing `rankTodayTasks` implementation.
3. THE Recommendation_Engine SHALL derive `Urgency_Score` from the task's `due_at` field: `overdue = 100`, `due within 24 hours = 70`, `due within 72 hours = 30`, `no due date = 0`.
4. THE Recommendation_Engine SHALL return tasks sorted by composite score in descending order, with ties broken by `created_at` ascending.
5. THE Recommendation_Engine SHALL include only tasks with `status = 'pending'` in the ranked output.

---

### Requirement 5: Recommendation Confidence Levels

**User Story:** As a VibeFocus user, I want to understand how confident the system is in each recommendation, so that I can judge when to follow suggestions and when to override them.

#### Acceptance Criteria

1. THE Recommendation_Engine SHALL assign a `confidence` level of `high` to a recommendation WHEN the Audit_History contains 10 or more matching records for that task's category or required_energy.
2. THE Recommendation_Engine SHALL assign a `confidence` level of `medium` to a recommendation WHEN the Audit_History contains between 3 and 9 matching records.
3. THE Recommendation_Engine SHALL assign a `confidence` level of `low` to a recommendation WHEN the Audit_History contains fewer than 3 matching records.

---

### Requirement 6: AI-Generated Recommendation Rationale

**User Story:** As a VibeFocus user, I want each recommended task to include a plain-language explanation of why it was chosen, so that I can understand and trust the AI's reasoning.

#### Acceptance Criteria

1. WHEN the Recommendation_API calls OpenAI, THE Recommendation_API SHALL send a structured prompt containing the top 5 ranked tasks, the user's Current_Energy, and a summary of the user's Affinity_Score by category, and SHALL request a one-sentence rationale (maximum 120 characters) for each task.
2. WHEN OpenAI returns a valid response, THE Recommendation_API SHALL attach the rationale string to the corresponding `Recommendation` object in the response payload.
3. IF the `OPENAI_API_KEY` environment variable is not set, THEN THE Recommendation_API SHALL generate rationale strings locally using the task's composite score factors without calling OpenAI.
4. IF the OpenAI API call fails or exceeds 5000 milliseconds, THEN THE Recommendation_API SHALL fall back to locally generated rationale strings and SHALL NOT return an error to the client.
5. THE Recommendation_API SHALL limit OpenAI rationale generation to 10 requests per user per Rate_Limit_Window, consistent with the `ai_import_usage` pattern.

---

### Requirement 7: Recommendation Caching

**User Story:** As a VibeFocus user, I want recommendations to load quickly and without burning unnecessary API credits, so that the experience remains smooth and cost-efficient.

#### Acceptance Criteria

1. THE Recommendation_API SHALL store each generated recommendation set in the Recommendation_Cache, keyed by `user_id`, with a `generated_at` timestamp and a `cache_key` derived from the hash of the user's pending task IDs, current energy level, and audit record count.
2. WHEN an incoming request has a matching `cache_key` in the Recommendation_Cache and the cached entry is less than 15 minutes old, THE Recommendation_API SHALL return the cached recommendations without recomputing or calling OpenAI.
3. WHEN the `cache_key` does not match or the cached entry is 15 minutes or older, THE Recommendation_API SHALL recompute recommendations and update the Recommendation_Cache.
4. THE Recommendation_API SHALL respond with a `X-Cache: HIT` header when serving from cache and a `X-Cache: MISS` header when recomputing.

---

### Requirement 8: API Contract and Authentication

**User Story:** As the VibeFocus frontend, I want a well-defined API endpoint for fetching recommendations, so that the UI can integrate recommendations reliably and securely.

#### Acceptance Criteria

1. THE Recommendation_API SHALL expose a `GET /api/ai/recommend` endpoint that accepts an optional `energy` query parameter with values `low`, `medium`, or `high`.
2. WHEN the `energy` query parameter is provided AND a valid Energy_Checkin exists within the past 12 hours, THE Recommendation_API SHALL validate that the provided `energy` value is one of `low`, `medium`, or `high` and SHALL use it as the Current_Energy; if the parameter is invalid, THE Recommendation_API SHALL return HTTP 400.
3. THE Recommendation_API SHALL return a JSON response conforming to: `{ recommendations: Recommendation[], cold_start: boolean, generated_at: string }` where each `Recommendation` contains `task`, `score`, `confidence`, and `reason`.
4. WHEN the request does not include a valid authenticated session, THE Recommendation_API SHALL return HTTP 401. WHEN the user is authenticated but has exceeded their Rate_Limit_Window quota, THE Recommendation_API SHALL return HTTP 429. IF a future payment gate is introduced, THEN THE Recommendation_API SHALL return HTTP 402 for payment-required denials and HTTP 403 for permission-based denials.
5. THE Recommendation_API SHALL return a maximum of 10 `Recommendation` objects per response.

---

### Requirement 9: Data Access and Security

**User Story:** As a VibeFocus user, I want my recommendation data to remain private and secure, so that no other user can access my energy patterns or task history.

#### Acceptance Criteria

1. THE Recommendation_API SHALL derive all user identifiers exclusively from the authenticated Supabase session and SHALL NOT accept a `user_id` as a request parameter.
2. THE Recommendation_Cache table SHALL have Row Level Security enabled with `own_select`, `own_insert`, and `own_update` policies scoped to `auth.uid() = user_id`, consistent with all other user-owned tables.
3. THE Recommendation_Engine SHALL be a pure function in `lib/domain/recommendation.ts` that accepts pre-fetched data arrays as parameters and performs no direct database access.
4. WHEN the Recommendation_API constructs the OpenAI prompt, THE Recommendation_API SHALL include only anonymised task data (title, category, required_energy, priority) and SHALL NOT include task IDs, user IDs, or personally identifiable information.

---

### Requirement 10: UI Integration — Today View Recommendations Panel

**User Story:** As a VibeFocus user, I want to see AI-powered recommendations directly in the Today view, so that I can quickly start the most appropriate task without navigating away.

#### Acceptance Criteria

1. WHEN a user visits `/dashboard/today`, THE Recommendation_Panel component SHALL fetch recommendations from `GET /api/ai/recommend` and display the top 3 results.
2. WHEN a user has not logged an energy checkin today, THE Recommendation_Panel SHALL display a prompt to log their current energy before showing recommendations.
3. WHEN recommendations are loading, THE Recommendation_Panel SHALL display a skeleton loading state for exactly 3 recommendation cards.
4. WHEN `cold_start: true` is present in the response, THE Recommendation_Panel SHALL display the message "Building your energy profile — complete more tasks to unlock personalised suggestions."
5. IF the Recommendation_API returns an error, THEN THE Recommendation_Panel SHALL display a non-blocking inline error message and SHALL NOT disrupt other content on the Today view.
6. WHEN a user taps or clicks a recommended task card, THE Recommendation_Panel SHALL navigate to the focus session for that task, consistent with the existing today-view task interaction.

---

### Requirement 11: Feedback Loop — Audit Result Integration

**User Story:** As a VibeFocus user, I want each energy audit I complete to immediately inform future recommendations, so that the system continuously adapts to how I actually feel about my work.

#### Acceptance Criteria

1. WHEN a user submits an energy audit for a completed task, THE Recommendation_Cache SHALL invalidate any cached recommendation entry for that user by deleting the matching row.
2. WHEN the Recommendation_Cache is invalidated, THE Recommendation_API SHALL recompute recommendations fresh on the next request.
3. THE Recommendation_Engine SHALL include all available Audit_History records (no time-based cutoff) when computing Affinity_Scores, so that patterns learnt from older audits continue to inform recommendations.
4. WHEN a user has submitted audits, THE Recommendation_Engine SHALL weight the most recent 20 audit records at `1.5x` relative to older records when computing Affinity_Scores, regardless of the user's total audit count, so that recent behaviour is more influential than distant history. WHEN a user has exactly 20 or more total audits, the 1.5x weight applies to the 20 most recent records.

