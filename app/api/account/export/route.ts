import { createClient } from "@/utils/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const tables = ["tasks", "projects", "goals", "user_settings", "focus_sessions", "task_energy_audits", "energy_checkins", "user_stats"] as const
  const entries = await Promise.all(tables.map(async (table) => [table, (await supabase.from(table).select("*").eq("user_id", user.id)).data ?? []]))
  return new Response(JSON.stringify({ exported_at: new Date().toISOString(), user: { id: user.id, email: user.email }, ...Object.fromEntries(entries) }, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": 'attachment; filename="vibefocus-export.json"', "cache-control": "private, no-store" },
  })
}
