"use server"

import { createClient } from "@/utils/supabase/server"
import { z } from "zod"

const idSchema = z.string().uuid()
const durationSchema = z.number().int().min(60).max(86400)

export interface RestoredFocusSession {
  id: string
  taskId: string
  plannedSeconds: number
  remainingSeconds: number
  status: "running" | "paused"
  endsAt: string | null
  updatedAt: string
}

export async function getActiveFocusSession(): Promise<RestoredFocusSession | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase.from("focus_sessions")
    .select("id,task_id,planned_duration_seconds,remaining_seconds,status,ends_at,updated_at")
    .eq("user_id", user.id)
    .in("status", ["running", "paused"])
    .not("task_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data?.task_id || (data.status !== "running" && data.status !== "paused")) return null
  const remaining = data.status === "running" && data.ends_at
    ? Math.max(0, Math.ceil((new Date(data.ends_at).getTime() - Date.now()) / 1000))
    : data.remaining_seconds
  if (remaining === 0) {
    await supabase.from("focus_sessions").update({
      status: "completed",
      remaining_seconds: 0,
      actual_duration_seconds: data.planned_duration_seconds,
      ended_at: new Date().toISOString(),
      ends_at: null,
    }).eq("id", data.id).eq("user_id", user.id)
    return null
  }
  return {
    id: data.id,
    taskId: data.task_id,
    plannedSeconds: data.planned_duration_seconds,
    remainingSeconds: remaining,
    status: data.status,
    endsAt: data.ends_at,
    updatedAt: data.updated_at,
  }
}

export async function startFocusSession(taskId: string, plannedSeconds: number) {
  const validTaskId = idSchema.parse(taskId)
  const validPlannedSeconds = durationSchema.parse(plannedSeconds)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Authentication required")
  const now = new Date()
  await supabase.from("focus_sessions").update({
    status: "cancelled",
    ended_at: now.toISOString(),
    ends_at: null,
  }).eq("user_id", user.id).in("status", ["running", "paused"])
  const { data, error } = await supabase.from("focus_sessions").insert({
    user_id: user.id, task_id: validTaskId, planned_duration_seconds: validPlannedSeconds,
    remaining_seconds: validPlannedSeconds, started_at: now.toISOString(),
    ends_at: new Date(now.getTime() + validPlannedSeconds * 1000).toISOString(), status: "running",
  }).select("id").single()
  if (error) throw new Error("Unable to start focus session")
  return data.id as string
}

export async function updateFocusSession(id: string, status: "running" | "paused" | "completed" | "cancelled", remaining: number) {
  const validId = idSchema.parse(id)
  const validRemaining = z.number().int().min(0).max(86400).parse(remaining)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Authentication required")
  const { data: current } = await supabase.from("focus_sessions").select("planned_duration_seconds").eq("id", validId).eq("user_id", user.id).maybeSingle()
  const now = new Date()
  const patch: Record<string, unknown> = { status, remaining_seconds: validRemaining }
  if (status === "paused") { patch.paused_at = now.toISOString(); patch.ends_at = null }
  if (status === "running") { patch.paused_at = null; patch.ends_at = new Date(now.getTime() + validRemaining * 1000).toISOString() }
  if (status === "completed" || status === "cancelled") {
    patch.ended_at = now.toISOString()
    patch.ends_at = null
    if (current) patch.actual_duration_seconds = Math.max(0, current.planned_duration_seconds - validRemaining)
  }
  const { error } = await supabase.from("focus_sessions").update(patch).eq("id", validId).eq("user_id", user.id)
  if (error) throw new Error("Unable to update focus session")
}
