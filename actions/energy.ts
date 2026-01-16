'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function logEnergy(level: number) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("User not authenticated")
    }

    const { error } = await supabase
        .from('energy_logs')
        .insert({
            user_id: user.id,
            level: level,
        })

    if (error) {
        console.error('Error logging energy:', error)
        throw new Error('Failed to log energy')
    }

    revalidatePath('/dashboard')
}

export async function getEnergyHistory(days: number = 7) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from('energy_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100) // Safety limit

    if (error) {
        console.error('Error fetching energy history:', error)
        return []
    }

    return data
}
