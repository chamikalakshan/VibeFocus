import { describe, expect, it } from "vitest"
import { defaultSettings, isMissingSettingsTable, parseStoredSettings } from "@/lib/domain/settings"

describe("settings compatibility", () => {
  it("accepts valid stored settings and rejects malformed metadata", () => {
    expect(parseStoredSettings(defaultSettings)).toEqual(defaultSettings)
    expect(parseStoredSettings({ ...defaultSettings, default_focus_minutes: 0 })).toBeNull()
  })

  it("only treats missing-relation errors as legacy-schema compatibility cases", () => {
    expect(isMissingSettingsTable({ code: "PGRST205" })).toBe(true)
    expect(isMissingSettingsTable({ code: "42501", message: "row-level security violation" })).toBe(false)
  })
})
