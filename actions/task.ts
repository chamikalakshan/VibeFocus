'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function getTasks() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching tasks:', error)
        return []
    }

    return data
}

export async function addTask(title: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    const { error } = await supabase
        .from('tasks')
        .insert({
            user_id: user.id,
            title,
        })

    if (error) {
        console.error('Error adding task:', error)
        throw new Error('Failed to add task')
    }

    revalidatePath('/dashboard/tasks')
}

export async function toggleTask(id: string, is_completed: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    const { error } = await supabase
        .from('tasks')
        .update({ is_completed })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error toggling task:', error)
        throw new Error('Failed to toggle task')
    }

    revalidatePath('/dashboard/tasks')
}

export async function deleteTask(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("User not authenticated")

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting task:', error)
        throw new Error('Failed to delete task')
    }

    revalidatePath('/task')
}
