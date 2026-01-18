"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export type TaskStatus = "pending" | "completed" | "audited"

export interface Task {
    id: string
    title: string
    status: TaskStatus
    energy?: "green" | "red" | "yellow"
    created_at: string // Supabase uses ISO string
}

interface VibeContextType {
    tasks: Task[]
    addTask: (title: string) => void
    addTasksBulk: (titles: string[]) => void
    completeTask: (id: string) => void
    updateTaskTitle: (id: string, title: string) => void
    auditTask: (id: string, energy: "green" | "red" | "yellow") => void
    streak: number
    addToStreak: () => void
    activeTaskId: string | null
    setActiveTaskId: (id: string | null) => void
    user: any
}

const VibeContext = createContext<VibeContextType | undefined>(undefined)

export function VibeProvider({ children }: { children: React.ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [streak, setStreak] = useState(0)
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchTasks(session.user.id)
            } else {
                // Redirect to login if needed, or allow public view (but we want sync)
                // For now, if no user, tasks are empty.
            }
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchTasks(session.user.id)
            } else {
                setTasks([])
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchTasks = async (userId: string) => {
        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })

        if (error) console.error("Error fetching tasks:", error)
        if (data) setTasks(data)
    }

    const addTask = async (title: string) => {
        if (!user) {
            router.push("/login")
            return
        }

        const newTask = {
            user_id: user.id,
            title,
            status: "pending",
        }

        const { data, error } = await supabase.from("tasks").insert(newTask).select().single()

        if (error) {
            console.error("Error adding task:", error)
            return
        }

        if (data) setTasks((prev) => [data, ...prev])
    }

    const addTasksBulk = async (titles: string[]) => {
        if (!user) {
            router.push("/login")
            return
        }

        const newTasks = titles.map((title) => ({
            user_id: user.id,
            title,
            status: "pending",
        }))

        const { data, error } = await supabase.from("tasks").insert(newTasks).select()

        if (error) {
            console.error("Error bulk adding:", error)
            return
        }

        if (data) setTasks((prev) => [...data, ...prev])
    }

    const completeTask = async (id: string) => {
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: "completed" } : t))
        )

        const { error } = await supabase
            .from("tasks")
            .update({ status: "completed" })
            .eq("id", id)

        if (error) console.error("Error completing task:", error)
    }

    const updateTaskTitle = async (id: string, title: string) => {
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, title } : t))
        )

        const { error } = await supabase
            .from("tasks")
            .update({ title })
            .eq("id", id)

        if (error) console.error("Error updating task title:", error)
    }

    const auditTask = async (id: string, energy: "green" | "red" | "yellow") => {
        // Optimistic update
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: "audited", energy } : t))
        )
        addToStreak()

        const { error } = await supabase
            .from("tasks")
            .update({ status: "audited", energy })
            .eq("id", id)

        if (error) console.error("Error auditing task:", error)
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
                updateTaskTitle,
                auditTask,
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
