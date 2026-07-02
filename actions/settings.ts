"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { isMissingSettingsTable, settingsSchema } from "@/lib/domain/settings"

export async function updateSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Authentication required")

  const values = settingsSchema.parse({
    display_name: String(formData.get("display_name") || "").trim() || null,
    timezone: String(formData.get("timezone") || "UTC"),
    theme: formData.get("theme"),
    reduced_motion: formData.get("reduced_motion") === "on",
    default_focus_minutes: Number(formData.get("default_focus_minutes")),
    default_break_minutes: Number(formData.get("default_break_minutes")),
    audio_enabled: formData.get("audio_enabled") === "on",
    timer_sound_enabled: formData.get("timer_sound_enabled") === "on",
    auto_start_break: formData.get("auto_start_break") === "on",
    auto_complete_task: formData.get("auto_complete_task") === "on",
    notifications_enabled: formData.get("notifications_enabled") === "on",
  })

  const { error } = await supabase.from("user_settings").upsert({ user_id: user.id, ...values })
  if (isMissingSettingsTable(error)) {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { vibefocus_settings: values },
    })
    if (metadataError) throw new Error("Unable to save settings")
  } else if (error) {
    throw new Error("Unable to save settings")
  }
  revalidatePath("/dashboard/settings")
}

export async function deleteCompletedTasks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Authentication required")
  const { error } = await supabase.from("tasks").delete().eq("user_id", user.id).eq("status", "completed")
  if (error) throw new Error("Unable to delete completed tasks")
  revalidatePath("/dashboard")
}
