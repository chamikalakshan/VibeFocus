import { z } from "zod"

export const settingsSchema = z.object({
  display_name: z.string().trim().max(80).nullable(),
  timezone: z.string().min(1).max(80),
  theme: z.enum(["dark", "light", "system"]),
  reduced_motion: z.boolean(),
  default_focus_minutes: z.number().int().min(1).max(60),
  default_break_minutes: z.number().int().min(1).max(60),
  audio_enabled: z.boolean(),
  timer_sound_enabled: z.boolean(),
  auto_start_break: z.boolean(),
  auto_complete_task: z.boolean(),
  notifications_enabled: z.boolean(),
})

export type UserSettings = z.infer<typeof settingsSchema>

export const defaultSettings: UserSettings = {
  display_name: null,
  timezone: "UTC",
  theme: "system",
  reduced_motion: false,
  default_focus_minutes: 25,
  default_break_minutes: 5,
  audio_enabled: false,
  timer_sound_enabled: true,
  auto_start_break: false,
  auto_complete_task: false,
  notifications_enabled: false,
}

export function parseStoredSettings(value: unknown): UserSettings | null {
  const result = settingsSchema.safeParse(value)
  return result.success ? result.data : null
}

export function isMissingSettingsTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === "PGRST205"
    || error.code === "42P01"
    || Boolean(error.message?.includes("Could not find the table 'public.user_settings'"))
}
