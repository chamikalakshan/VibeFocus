import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const createSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
})
const bulkSchema = z.object({ tasks: z.array(createSchema).min(1).max(100) })
const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  due_at: z.string().datetime().nullable().optional(),
  estimated_minutes: z.number().int().min(1).max(1440).nullable().optional(),
  required_energy: z.enum(["low", "medium", "high"]).nullable().optional(),
  category: z.string().trim().max(80).nullable().optional(),
  recurrence: z.enum(["daily", "weekdays", "weekly", "monthly"]).nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  goal_id: z.string().uuid().nullable().optional(),
}).refine((values) => Object.keys(values).length > 0, "At least one update is required")
const patchSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["complete", "reopen", "rename", "update", "audit", "clear_audit"]),
  title: z.string().trim().min(1).max(200).optional(),
  rating: z.enum(["green", "yellow", "red"]).optional(),
  values: taskUpdateSchema.optional(),
})

async function session() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await session()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const canonical = await supabase.from("tasks").select("*,task_energy_audits(rating)").eq("user_id", user.id).order("created_at", { ascending: false })
  if (!canonical.error) {
    const { data: stats } = await supabase.from("user_stats").select("current_streak").eq("user_id", user.id).maybeSingle()
    return Response.json({ tasks: canonical.data, streak: stats?.current_streak ?? 0, canonical: true }, { headers: { "cache-control": "private, no-store" } })
  }
  const legacy = await supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
  if (legacy.error) return Response.json({ error: "Unable to load tasks" }, { status: 503 })
  return Response.json({ tasks: legacy.data, canonical: false }, { headers: { "cache-control": "private, no-store" } })
}

export async function POST(request: Request) {
  const { supabase, user } = await session()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const body: unknown = await request.json()
  const bulk = bulkSchema.safeParse(body)
  const single = createSchema.safeParse(body)
  if (!bulk.success && !single.success) return Response.json({ error: "Invalid task input" }, { status: 400 })
  const tasks = bulk.success ? bulk.data.tasks : [single.data]
  const canonicalRows = tasks.map((task) => ({ ...task, user_id: user.id, status: "pending", source: bulk.success ? "bulk_import" : "manual" }))
  const result = await supabase.from("tasks").insert(canonicalRows).select()
  if (!result.error) return Response.json({ tasks: result.data }, { status: 201 })
  const legacy = await supabase.from("tasks").insert(tasks.map((task) => ({ ...task, user_id: user.id, status: "pending" }))).select()
  if (legacy.error) return Response.json({ error: "Unable to create task" }, { status: 503 })
  return Response.json({ tasks: legacy.data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const { supabase, user } = await session()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const input = patchSchema.safeParse(await request.json())
  if (!input.success) return Response.json({ error: "Invalid task update" }, { status: 400 })
  const { id, action } = input.data
  if (action === "audit" || action === "clear_audit") {
    if (action === "clear_audit") {
      const canonical = await supabase.from("task_energy_audits").delete().eq("task_id", id).eq("user_id", user.id)
      if (!canonical.error) return Response.json({ ok: true })
      const legacy = await supabase.from("tasks").update({ status: "completed", energy: null }).eq("id", id).eq("user_id", user.id)
      return legacy.error ? Response.json({ error: "Unable to clear audit" }, { status: 503 }) : Response.json({ ok: true })
    }
    if (!input.data.rating) return Response.json({ error: "Rating required" }, { status: 400 })
    const rating = input.data.rating === "green" ? "energizing" : input.data.rating === "red" ? "draining" : "neutral"
    const canonical = await supabase.from("task_energy_audits").upsert({ user_id: user.id, task_id: id, rating, audited_at: new Date().toISOString() }, { onConflict: "task_id" })
    if (!canonical.error) return Response.json({ ok: true })
    const legacy = await supabase.from("tasks").update({ status: "audited", energy: input.data.rating }).eq("id", id).eq("user_id", user.id)
    return legacy.error ? Response.json({ error: "Unable to audit task" }, { status: 503 }) : Response.json({ ok: true })
  }
  if (action === "update") {
    if (!input.data.values) return Response.json({ error: "Task updates required" }, { status: 400 })
    let result = await supabase.from("tasks").update(input.data.values).eq("id", id).eq("user_id", user.id).select().maybeSingle()
    if (result.error && input.data.values.title && Object.keys(input.data.values).length === 1) {
      result = await supabase.from("tasks").update({ title: input.data.values.title }).eq("id", id).eq("user_id", user.id).select().maybeSingle()
    }
    if (result.error || !result.data) return Response.json({ error: result.error ? "Unable to update task details" : "Task not found" }, { status: result.error ? 503 : 404 })
    return Response.json({ task: result.data })
  }
  const values = action === "complete" ? { status: "completed", completed_at: new Date().toISOString() }
    : action === "reopen" ? { status: "pending", completed_at: null }
      : { title: input.data.title }
  let result = await supabase.from("tasks").update(values).eq("id", id).eq("user_id", user.id).select().maybeSingle()
  if (result.error && (action === "complete" || action === "reopen")) {
    result = await supabase.from("tasks").update({ status: action === "complete" ? "completed" : "pending" }).eq("id", id).eq("user_id", user.id).select().maybeSingle()
  }
  if (result.error || !result.data) return Response.json({ error: "Task not found" }, { status: result.error ? 503 : 404 })
  return Response.json({ task: result.data })
}

export async function DELETE(request: Request) {
  const { supabase, user } = await session()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const id = new URL(request.url).searchParams.get("id")
  if (!z.string().uuid().safeParse(id).success) return Response.json({ error: "Invalid task ID" }, { status: 400 })
  const { error } = await supabase.from("tasks").delete().eq("id", id!).eq("user_id", user.id)
  return error ? Response.json({ error: "Unable to delete task" }, { status: 503 }) : Response.json({ ok: true })
}
