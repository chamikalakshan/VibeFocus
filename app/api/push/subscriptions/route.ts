import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = subscriptionSchema.safeParse(await request.json())
  if (!parsed.success) return Response.json({ error: "Invalid subscription" }, { status: 400 })
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth,
  }, { onConflict: "user_id,endpoint" })
  return error ? Response.json({ error: "Unable to save subscription" }, { status: 500 }) : new Response(null, { status: 204 })
}
