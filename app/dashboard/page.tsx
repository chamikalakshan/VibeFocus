"use client"

import { useState } from "react"
import { useVibe } from "@/context/VibeContext"
import { TaskFeed } from "@/components/dashboard/TaskFeed"
import { StreakWidget } from "@/components/dashboard/StreakWidget"
import { EnergyAudit } from "@/components/features/EnergyAudit"
import { FocusMode } from "@/components/features/FocusMode"
import { AnimatePresence, motion } from "framer-motion"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card" // Added Card import
import { EnergyChart } from "@/components/dashboard/EnergyChart" // Added EnergyChart import

export default function DashboardPage() {
    const { activeTaskId, addTask, user } = useVibe()
    const [newTask, setNewTask] = useState("")

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTask.trim()) return
        addTask(newTask)
        setNewTask("")
    }

    // Get greeting based on time
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24">
            {/* Header Section */}
            <div className="space-y-1">
                <p className="text-muted-foreground uppercase tracking-widest text-xs font-medium">
                    {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <h1 className="text-4xl font-bold tracking-tight">
                    {greeting}, <span className="text-primary">{user?.email?.split('@')[0] || 'Viber'}</span>.
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: Tasks */}
                <div className="md:col-span-8 space-y-6">
                    {/* Add Task Form — aligned with Your Flow */}
                    <form onSubmit={handleAddTask} className="flex items-center gap-3">
                        <Input
                            placeholder="What's the move?"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            className="bg-card/60 backdrop-blur border-primary/40 focus-visible:ring-primary text-base h-12 px-5 rounded-xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] flex-1"
                        />
                        <Button type="submit" className="shrink-0 bg-primary hover:bg-primary/90 h-12 px-5 rounded-xl shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] gap-2">
                            <Plus className="w-4 h-4" />
                            Add New Task
                        </Button>
                    </form>

                    <TaskFeed hideCompleted hideOlderThanHours={24} />
                    <EnergyChart />
                </div>

                {/* Right Column: Stats & Audit */}
                <div className="md:col-span-4 space-y-6">
                    <StreakWidget />
                    <Card className="min-h-[400px] border-none bg-black/40 backdrop-blur-xl relative overflow-hidden">
                        <EnergyAudit />
                    </Card>
                </div>
            </div>

            <AnimatePresence>
                {activeTaskId && <FocusMode taskId={activeTaskId} />}
            </AnimatePresence>
        </div >
    )
}
