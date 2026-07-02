import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"
import { z } from "zod"
import { taskSuggestionsSchema } from "@/lib/domain/imports"
import { createClient } from "@/utils/supabase/server"

const requestSchema = z.object({ input: z.string().trim().min(3).max(4000), timezone: z.string().min(1).max(80).default("UTC") })
const outputSchema = z.object({ tasks: taskSuggestionsSchema })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "AI import is unavailable. Use Bulk Import instead." }, { status: 503 })

  const parsed = requestSchema.safeParse(await request.json())
  if (!parsed.success) return Response.json({ error: "Invalid import request" }, { status: 400 })

  const hour = new Date()
  hour.setMinutes(0, 0, 0)
  const { data: usage } = await supabase.from("ai_import_usage").select("request_count").eq("user_id", user.id).eq("window_started_at", hour.toISOString()).maybeSingle()
  if ((usage?.request_count ?? 0) >= 10) return Response.json({ error: "Hourly AI import limit reached" }, { status: 429 })
  await supabase.from("ai_import_usage").upsert({ user_id: user.id, window_started_at: hour.toISOString(), request_count: (usage?.request_count ?? 0) + 1 })

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.responses.parse({
    model: "gpt-4.1-mini",
    input: `Current ISO time: ${new Date().toISOString()}. User timezone: ${parsed.data.timezone}. Convert into practical task suggestions:\n${parsed.data.input}`,
    text: { format: zodTextFormat(outputSchema, "task_import") },
  })
  return Response.json(response.output_parsed ?? { tasks: [] })
}
