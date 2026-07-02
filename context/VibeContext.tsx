"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { queueMutation } from "@/lib/offline/db"

export type TaskStatus = "pending" | "completed" | "archived"

export interface Task {
    id: string
    title: string
    status: TaskStatus
    energy?: "green" | "red" | "yellow"
    created_at: string // Supabase uses ISO string
    completed_at?: string | null
    updated_at?: string
    description?: string | null
    priority?: "low" | "medium" | "high"
    due_at?: string | null
    estimated_minutes?: number | null
    required_energy?: "low" | "medium" | "high" | null
    category?: string | null
    source?: "manual" | "bulk_import" | "ai_import"
    top_priority_rank?: number | null
    recurrence?: "daily" | "weekdays" | "weekly" | "monthly" | null
    recurrence_parent_id?: string | null
    occurrence_date?: string | null
    project_id?: string | null
    goal_id?: string | null
    sync_state?: "synced" | "pending" | "failed"
}

export type TaskUpdate = Partial<Pick<Task, "title" | "description" | "priority" | "due_at" | "estimated_minutes" | "required_energy" | "category" | "recurrence" | "project_id" | "goal_id">>

interface VibeContextType {
    tasks: Task[]
    addTask: (title: string) => void
    addTasksBulk: (titles: string[]) => void
    completeTask: (id: string) => void
    reopenTask: (id: string) => void
    updateTaskTitle: (id: string, title: string) => void
    updateTask: (id: string, values: TaskUpdate) => Promise<boolean>
    deleteTask: (id: string) => void
    auditTask: (id: string, energy: "green" | "red" | "yellow") => void
    clearAudit: (id: string) => void
    streak: number
    addToStreak: () => void
    activeTaskId: string | null
    setActiveTaskId: (id: string | null) => void
    user: User | null
}

const VibeContext = createContext<VibeContextType | undefined>(undefined)

function normalizeTask(row: Record<string, unknown>): Task {
    const audits = Array.isArray(row.task_energy_audits) ? row.task_energy_audits as Array<{ rating?: string }> : []
    const rating = audits[0]?.rating
    const legacyEnergy = typeof row.energy === "string" ? row.energy : undefined
    const status = row.status === "audited" ? "completed" : row.status
    return {
        ...row,
        status: status === "completed" || status === "archived" ? status : "pending",
        priority: row.priority === "low" || row.priority === "high" ? row.priority : "medium",
        sync_state: "synced",
        energy: rating === "energizing" ? "green"
            : rating === "draining" ? "red"
                : rating === "neutral" ? "yellow"
                    : legacyEnergy === "green" || legacyEnergy === "red" || legacyEnergy === "yellow" ? legacyEnergy : undefined,
    } as Task
}

export function VibeProvider({ children }: { children: React.ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [streak, setStreak] = useState(0)
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const router = useRouter()

    const fetchTasks = React.useCallback(async () => {
        try {
            const response = await fetch("/api/tasks", { cache: "no-store" })
            if (!response.ok) throw new Error("Unable to load tasks")
            const result = await response.json() as { tasks: Record<string, unknown>[]; streak?: number; canonical: boolean }
            const normalized = result.tasks.map((row) => normalizeTask(row))
            setTasks(normalized)
            if (!result.canonical) {
                const completedDays = new Set(normalized.filter((task) => task.status === "completed").map((task) => new Date(task.completed_at ?? task.created_at).toLocaleDateString()))
                setStreak(completedDays.size)
            } else {
                setStreak(result.streak ?? 0)
            }
        } catch {
            console.error("Error fetching tasks")
        }
    }, [])

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchTasks()
            } else {
                // Redirect to login if needed, or allow public view (but we want sync)
                // For now, if no user, tasks are empty.
            }
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "INITIAL_SESSION") return
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchTasks()
            } else {
                setTasks([])
            }
        })

        return () => subscription.unsubscribe()
    }, [fetchTasks])

    const addTask = async (title: string) => {
        if (!user) {
            router.push("/login")
            return
        }

        const id = crypto.randomUUID()
        const response = await fetch("/api/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, title }) })
        if (!response.ok) {
            console.error("Error adding task")
            await queueMutation({ ownerId: user.id, entity: "task", operation: "create", payload: { id, title } })
            setTasks((prev) => [{ id, title, status: "pending", created_at: new Date().toISOString(), sync_state: "pending" }, ...prev])
            return
        }
        const { tasks: created } = await response.json() as { tasks: Record<string, unknown>[] }
        setTasks((prev) => [normalizeTask(created[0]), ...prev])
    }

    const addTasksBulk = async (titles: string[]) => {
        if (!user) {
            router.push("/login")
            return
        }

        const response = await fetch("/api/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tasks: titles.map((title) => ({ title })) }) })
        if (!response.ok) {
            console.error("Error bulk adding")
            return
        }
        const { tasks: created } = await response.json() as { tasks: Record<string, unknown>[] }
        setTasks((prev) => [...created.map(normalizeTask), ...prev])
    }

    const completeTask = async (id: string) => {
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: "completed", completed_at: new Date().toISOString() } : t))
        )

        const response = await fetch("/api/tasks", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action: "complete" }) })
        if (!response.ok) {
            console.error("Error completing task")
            if (user) await queueMutation({ ownerId: user.id, entity: "task", operation: "update", payload: { id, status: "completed", completed_at: new Date().toISOString() } })
        }
    }

    const reopenTask = async (id: string) => {
        setTasks((prev) => prev.map((task) => task.id === id ? { ...task, status: "pending", completed_at: null, energy: undefined } : task))
        const response = await fetch("/api/tasks", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action: "reopen" }) })
        if (!response.ok && user) await queueMutation({ ownerId: user.id, entity: "task", operation: "update", payload: { id, status: "pending", completed_at: null } })
    }

    const updateTask = async (id: string, values: TaskUpdate) => {
        const previous = tasks.find((task) => task.id === id)
        setTasks((current) => current.map((task) => task.id === id ? { ...task, ...values, sync_state: "pending" } : task))
        const response = await fetch("/api/tasks", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action: "update", values }) })
        if (!response.ok) {
            console.error("Error updating task")
            if (user) {
                await queueMutation({ ownerId: user.id, entity: "task", operation: "update", payload: { id, ...values } })
                return true
            }
            if (previous) setTasks((current) => current.map((task) => task.id === id ? previous : task))
            return false
        }
        const { task } = await response.json() as { task: Record<string, unknown> }
        setTasks((current) => current.map((item) => item.id === id ? normalizeTask(task) : item))
        return true
    }

    const updateTaskTitle = async (id: string, title: string) => {
        await updateTask(id, { title })
    }

    const auditTask = async (id: string, energy: "green" | "red" | "yellow") => {
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, energy } : t))
        )
        addToStreak()

        const response = await fetch("/api/tasks", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action: "audit", rating: energy }) })
        if (!response.ok) console.error("Error auditing task")
    }

    const clearAudit = async (id: string) => {
        setTasks((prev) => prev.map((task) => task.id === id ? { ...task, energy: undefined } : task))
        const response = await fetch("/api/tasks", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action: "clear_audit" }) })
        if (!response.ok) console.error("Error undoing audit")
    }

    const deleteTask = async (id: string) => {
        // Optimistic update
        setTasks((prev) => prev.filter((t) => t.id !== id))

        const response = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" })
        if (!response.ok) {
            console.error("Error deleting task")
            if (user) await queueMutation({ ownerId: user.id, entity: "task", operation: "delete", payload: { id } })
        }
    }

    const addToStreak = () => {
        setStreak((prev) => prev + 1)
        // TODO: Persist streak in a 'profiles' table later
    }

    return (
        <VibeContext.Provider
            value={{
                tasks,
                addTask,
                addTasksBulk,
                completeTask,
                reopenTask,
                updateTaskTitle,
                updateTask,
                deleteTask,
                auditTask,
                clearAudit,
                streak,
                addToStreak,
                activeTaskId,
                setActiveTaskId,
                user
            }}
        >
            {children}
        </VibeContext.Provider>
    )
}

export function useVibe() {
    const context = useContext(VibeContext)
    if (!context) {
        throw new Error("useVibe must be used within a VibeProvider")
    }
    return context
}
