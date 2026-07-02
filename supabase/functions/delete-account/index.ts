import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async (request) => {
  const auth = request.headers.get("authorization")
  if (!auth) return new Response("Unauthorized", { status: 401 })
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
  const { error } = await admin.auth.admin.deleteUser(user.id)
  return error ? Response.json({ error: "Deletion failed" }, { status: 500 }) : new Response(null, { status: 204 })
})
