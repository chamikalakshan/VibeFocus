"use server"

import { createClient } from "@/utils/supabase/server"
import { isLegacyTaskSchemaError } from "@/lib/domain/planning"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable(),
  priority: z.enum(["low", "medium", "high"]),
  due_at: z.string().datetime().nullable(),
  estimated_minutes: z.number().int().min(1).max(1440).nullable(),
  required_energy: z.enum(["low", "medium", "high"]).nullable(),
  category: z.string().trim().max(80).nullable(),
  recurrence: z.enum(["daily", "weekdays", "weekly", "monthly"]).nullable(),
  project_id: z.string().uuid().nullable(),
  goal_id: z.string().uuid().nullable(),
})

const importedTaskSchema = taskSchema.pick({
  title: true, priority: true, due_at: true, estimated_minutes: true, required_energy: true, category: true,
}).extend({ source: z.enum(["bulk_import", "ai_import"]) })

export async function createPlannedTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Authentication required")
  const due = String(formData.get("due_at") || "")
  const estimate = String(formData.get("estimated_minutes") || "")
  const values = taskSchema.parse({
    title: formData.get("title"),
    description: String(formData.get("description") || "").trim() || null,
    priority: formData.get("priority") || "medium",
    due_at: due ? new Date(due).toISOString() : null,
    estimated_minutes: estimate ? Number(estimate) : null,
    required_energy: formData.get("required_energy") || null,
    category: String(formData.get("category") || "").trim() || null,
    recurrence: formData.get("recurrence") || null,
    project_id: formData.get("project_id") || null,
    goal_id: formData.get("goal_id") || null,
  })
  const canonical = await supabase.from("tasks").insert({ ...values, user_id: user.id, status: "pending", source: "manual" })
  if (canonical.error) {
    if (!isLegacyTaskSchemaError(canonical.error)) throw new Error("Unable to create task")
    const legacy = await supabase.from("tasks").insert({ user_id: user.id, title: values.title })
    if (legacy.error) throw new Error("Unable to create task")
  }
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/tasks")
}

export async function reopenTask(id: string) {
  const validId = z.string().uuid().parse(id)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Authentication required")
  const { error } = await supabase.from("tasks").update({ status: "pending", completed_at: null }).eq("id", validId).eq("user_id", user.id)
  if (error) throw new Error("Unable to reopen task")
  revalidatePath("/dashboard")
}

export async function saveImportedTasks(input: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Authentication required")
  const tasks = z.array(importedTaskSchema).min(1).max(50).parse(input)
  const canonical = await supabase.from("tasks").insert(tasks.map((task) => ({ ...task, user_id: user.id, status: "pending" })))
  if (canonical.error) {
    if (!isLegacyTaskSchemaError(canonical.error)) throw new Error("Unable to save imported tasks")
    const legacy = await supabase.from("tasks").insert(tasks.map((task) => ({ user_id: user.id, title: task.title })))
    if (legacy.error) throw new Error("Unable to save imported tasks")
  }
  revalidatePath("/dashboard/tasks")
}
