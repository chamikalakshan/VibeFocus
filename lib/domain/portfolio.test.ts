import { describe, expect, it } from "vitest"
import { portfolioProgress } from "./portfolio"
import { formatDuration } from "./presentation"

describe("Phase 1 presentation foundations", () => {
  it("calculates portfolio progress without archived tasks", () => {
    expect(portfolioProgress(["completed", "pending", "archived"])).toBe(50)
    expect(portfolioProgress([])).toBe(0)
  })

  it("formats task estimates", () => {
    expect(formatDuration(25)).toBe("25 min")
    expect(formatDuration(90)).toBe("1h 30m")
  })
})
