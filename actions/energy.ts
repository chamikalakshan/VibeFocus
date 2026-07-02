'use server'

import { createClient } from "@/utils/supabase/server"

export async function saveEnergyCheckin(level: "low" | "medium" | "high") {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false }
    const numericLevel = level === "low" ? 2 : level === "high" ? 4 : 3
    const { error } = await supabase.from("energy_checkins").insert({ user_id: user.id, level: numericLevel, checked_at: new Date().toISOString() })
    return { ok: !error }
}

export async function getEnergyHistory(days: number = 7) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { data: [], error: "Authentication required" }
    }

    const since = new Date()
    since.setDate(since.getDate() - days)
    const { data, error } = await supabase
        .from('task_energy_audits')
        .select('rating, audited_at')
        .eq('user_id', user.id)
        .gte('audited_at', since.toISOString())
        .order('audited_at', { ascending: true })
        .limit(100) // Safety limit

    if (error) {
        const legacy = await supabase
            .from("energy_logs")
            .select("level, created_at")
            .eq("user_id", user.id)
            .gte("created_at", since.toISOString())
            .order("created_at", { ascending: true })
            .limit(100)
        if (legacy.error) return { data: [], error: "Energy history is unavailable until the analytics schema is applied." }
        return { data: legacy.data, error: null }
    }

    return { data: data.map((audit) => ({
        level: audit.rating === "energizing" ? 90 : audit.rating === "draining" ? 10 : 50,
        created_at: audit.audited_at,
    })), error: null }
}
