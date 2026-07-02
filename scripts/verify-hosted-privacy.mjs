const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before running this read-only audit.")
  process.exit(1)
}

const tables = [
  "tasks", "projects", "goals", "user_settings", "focus_sessions",
  "task_energy_audits", "energy_checkins", "user_stats",
  "push_subscriptions", "processed_mutations", "ai_import_usage",
]

let missing = 0
let exposed = 0
for (const table of tables) {
  const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers: { apikey: key } })
  const body = await response.text()
  if (response.status === 404 && body.includes("PGRST205")) {
    missing += 1
    console.log(`MISSING  ${table}`)
  } else if (response.ok && body !== "[]") {
    exposed += 1
    console.error(`EXPOSED  ${table}: anonymous request returned row data`)
  } else if (response.ok) {
    console.log(`ISOLATED ${table}: anonymous request returned no rows`)
  } else {
    console.log(`DENIED   ${table}: HTTP ${response.status}`)
  }
}

if (missing) console.error(`Hosted schema is missing ${missing} canonical user-owned table(s). Apply validated migrations before production rollout.`)
if (exposed) console.error(`Anonymous row exposure detected on ${exposed} table(s).`)
process.exitCode = missing || exposed ? 1 : 0
