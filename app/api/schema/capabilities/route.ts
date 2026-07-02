import { createClient } from "@/utils/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized", canonical: false, canonicalTasks: false, projects: false, goals: false, focusSessions: false, audits: false, stats: false }, { status: 401 })

  const [{ error: taskError }, { error: auditError }, { error: statsError }, { error: focusError }, { error: projectError }, { error: goalError }] = await Promise.all([
    supabase.from("tasks").select("id,priority,due_at,required_energy").eq("user_id", user.id).limit(1),
    supabase.from("tasks").select("id, task_energy_audits(rating)").eq("user_id", user.id).limit(1),
    supabase.from("user_stats").select("current_streak").eq("user_id", user.id).limit(1),
    supabase.from("focus_sessions").select("id").eq("user_id", user.id).limit(1),
    supabase.from("projects").select("id").eq("user_id", user.id).limit(1),
    supabase.from("goals").select("id").eq("user_id", user.id).limit(1),
  ])

  const capabilities = {
    canonicalTasks: !taskError,
    audits: !auditError,
    stats: !statsError,
    focusSessions: !focusError,
    projects: !projectError,
    goals: !goalError,
  }
  return Response.json(
    { ...capabilities, canonical: capabilities.canonicalTasks && capabilities.audits && capabilities.stats },
    { headers: { "cache-control": "private, no-store" } },
  )
}
