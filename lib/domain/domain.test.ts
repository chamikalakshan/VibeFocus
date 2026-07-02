import { describe, expect, it } from "vitest"
import { calculateStreak } from "./streaks"
import { pauseTimer, remainingSeconds, resumeTimer } from "./timer"
import { parseBulkTasks } from "./imports"
import { isLegacyTaskSchemaError, rankTodayTasks } from "./planning"

describe("domain calculations", () => {
  it("counts one completion per day and preserves longest streak", () => {
    const result = calculateStreak(
      ["2026-06-09T10:00:00Z", "2026-06-10T10:00:00Z", "2026-06-10T12:00:00Z"],
      "UTC",
      new Date("2026-06-11T10:00:00Z"),
    )
    expect(result).toEqual({ current: 2, longest: 2 })
  })

  it("derives timer state from timestamps", () => {
    const state = resumeTimer({ status: "paused", endsAt: null, remainingSeconds: 60 }, 1_000)
    expect(remainingSeconds(state, 31_000)).toBe(30)
    expect(pauseTimer(state, 31_000).remainingSeconds).toBe(30)
  })

  it("normalizes and deduplicates bulk imports", () => {
    expect(parseBulkTasks(" One \nTwo\none\n\n", ["two"])).toEqual(["One"])
  })

  it("prioritizes an overdue task", () => {
    const base = { description: null, status: "pending" as const, priority: "low" as const, estimated_minutes: null, required_energy: null, category: null, source: "manual" as const, top_priority_rank: null, recurrence: null, recurrence_parent_id: null, occurrence_date: null, project_id: null, goal_id: null, created_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-01T00:00:00Z", completed_at: null }
    const ranked = rankTodayTasks([
      { ...base, id: "1", title: "Later", due_at: "2026-06-20T00:00:00Z" },
      { ...base, id: "2", title: "Overdue", due_at: "2026-06-10T00:00:00Z" },
    ], "medium", new Date("2026-06-11T00:00:00Z"))
    expect(ranked[0].task.id).toBe("2")
  })

  it("only treats missing task columns as legacy-schema compatibility errors", () => {
    expect(isLegacyTaskSchemaError({ code: "PGRST204" })).toBe(true)
    expect(isLegacyTaskSchemaError({ code: "42703" })).toBe(true)
    expect(isLegacyTaskSchemaError({ code: "42501", message: "row-level security violation" })).toBe(false)
  })
})
