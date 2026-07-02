import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const mutationSchema = z.object({
  id: z.string().uuid(),
  entity: z.enum(["task", "project", "goal"]),
  operation: z.enum(["create", "update", "delete"]),
  payload: z.record(z.string(), z.unknown()),
  clientTimestamp: z.string().datetime(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = z.array(mutationSchema).max(100).safeParse(await request.json())
  if (!parsed.success) return Response.json({ error: "Invalid mutation batch" }, { status: 400 })

  const applied: string[] = []
  for (const mutation of parsed.data) {
    const { data: done } = await supabase.from("processed_mutations").select("id").eq("id", mutation.id).eq("user_id", user.id).maybeSingle()
    if (done) { applied.push(mutation.id); continue }
    const recordId = typeof mutation.payload.id === "string" ? mutation.payload.id : undefined
    const table = mutation.entity === "task" ? "tasks" : mutation.entity === "project" ? "projects" : "goals"
    let error
    if (mutation.operation === "delete" && recordId) {
      ;({ error } = await supabase.from(table).delete().eq("id", recordId).eq("user_id", user.id))
    } else if (mutation.operation === "update" && recordId) {
      const taskFields = ["title", "status", "completed_at", "description", "priority", "due_at", "estimated_minutes", "required_energy", "category", "project_id", "goal_id"]
      const portfolioFields = ["name", "description", "status", "color", "goal_id", "target_date"]
      const allowed = Object.fromEntries(Object.entries(mutation.payload).filter(([key]) => (mutation.entity === "task" ? taskFields : portfolioFields).includes(key)))
      ;({ error } = await supabase.from(table).update({ ...allowed, updated_at: mutation.clientTimestamp }).eq("id", recordId).eq("user_id", user.id))
    } else if (mutation.operation === "create") {
      const label = mutation.entity === "task" ? mutation.payload.title : mutation.payload.name
      if (typeof label !== "string" || !label.trim()) continue
      const values = mutation.entity === "task"
        ? { id: recordId, title: label.trim(), user_id: user.id, status: "pending", source: "manual", created_at: mutation.clientTimestamp, updated_at: mutation.clientTimestamp }
        : { ...mutation.payload, id: recordId, name: label.trim(), user_id: user.id, created_at: mutation.clientTimestamp, updated_at: mutation.clientTimestamp }
      ;({ error } = await supabase.from(table).insert(values))
    }
    if (!error) {
      await supabase.from("processed_mutations").insert({ id: mutation.id, user_id: user.id })
      applied.push(mutation.id)
    }
  }
  return Response.json({ applied })
}
