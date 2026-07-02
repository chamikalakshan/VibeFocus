import { createClient } from "@/utils/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const [{ data: sessions, error: sessionsError }, { data: stats }] = await Promise.all([
    supabase.from("focus_sessions").select("status,actual_duration_seconds,planned_duration_seconds,started_at").eq("user_id", user.id),
    supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
  ])
  if (sessionsError) return Response.json({ error: "Focus analytics are unavailable until the canonical schema is applied." }, { status: 503 })
  const completed = sessions?.filter((session) => session.status === "completed") ?? []
  const total = completed.reduce((sum, session) => sum + session.actual_duration_seconds, 0)
  const planned = completed.reduce((sum, session) => sum + session.planned_duration_seconds, 0)
  return Response.json({
    focus: {
      total_seconds: total,
      average_seconds: completed.length ? Math.round(total / completed.length) : 0,
      completed_sessions: completed.length,
      cancelled_sessions: sessions?.filter((session) => session.status === "cancelled").length ?? 0,
      completion_rate: sessions?.length ? Math.round(completed.length / sessions.length * 100) : 0,
      planned_seconds: planned,
    },
    streak: stats ?? { current_streak: 0, longest_streak: 0, total_completed_tasks: 0 },
  }, { headers: { "cache-control": "private, no-store" } })
}
