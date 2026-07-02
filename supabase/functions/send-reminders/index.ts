import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

Deno.serve(async (request) => {
  const cronSecret = Deno.env.get("CRON_SECRET")
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) return new Response("Unauthorized", { status: 401 })
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!)
  const { data, error } = await supabase.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth,user_settings!inner(notifications_enabled)").eq("user_settings.notifications_enabled", true)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  const expired: string[] = []
  const results = await Promise.allSettled(data.map(async (subscription) => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: "VibeFocus", body: "Review your plan and protect your streak.", url: "/dashboard/today" }))
    } catch (error) {
      if (typeof error === "object" && error && "statusCode" in error && (error.statusCode === 404 || error.statusCode === 410)) expired.push(subscription.id)
      throw error
    }
  }))
  if (expired.length) await supabase.from("push_subscriptions").delete().in("id", expired)
  return Response.json({ sent: results.filter((result) => result.status === "fulfilled").length, expired: expired.length })
})
