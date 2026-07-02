import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const entitySchema = z.enum(["projects", "goals"])
const createSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
})
const updateSchema = createSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(["active", "paused", "completed", "archived", "achieved"]).optional(),
})

async function auth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(_: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { supabase, user } = await auth()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const entity = entitySchema.safeParse((await params).entity)
  if (!entity.success) return Response.json({ error: "Not found" }, { status: 404 })
  const { data, error } = await supabase.from(entity.data).select("*").eq("user_id", user.id).neq("status", "archived").order("updated_at", { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 503 })
  return Response.json({ data }, { headers: { "cache-control": "private, no-store" } })
}

export async function POST(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { supabase, user } = await auth()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const entity = entitySchema.safeParse((await params).entity)
  const input = createSchema.safeParse(await request.json())
  if (!entity.success || !input.success) return Response.json({ error: "Invalid request" }, { status: 400 })
  const { data, error } = await supabase.from(entity.data).insert({ id: input.data.id, user_id: user.id, name: input.data.name, description: input.data.description || null }).select().single()
  if (error) return Response.json({ error: error.message }, { status: 503 })
  return Response.json({ data }, { status: 201 })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { supabase, user } = await auth()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const entity = entitySchema.safeParse((await params).entity)
  const input = updateSchema.safeParse(await request.json())
  if (!entity.success || !input.success) return Response.json({ error: "Invalid request" }, { status: 400 })
  const { id, ...values } = input.data
  const { data, error } = await supabase.from(entity.data).update(values).eq("id", id).eq("user_id", user.id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 503 })
  return Response.json({ data })
}
