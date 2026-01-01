"use client"

import { useState } from "react"
import { useVibe } from "@/context/VibeContext"
import { Header } from "@/components/layout/Header"
import { TaskFeed } from "@/components/features/TaskFeed"
import { FocusMode } from "@/components/features/FocusMode"
import { EnergyAudit } from "@/components/features/EnergyAudit"
import { AnimatePresence } from "framer-motion"
import { ListTodo, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
    const { activeTaskId, tasks } = useVibe()
    const [view, setView] = useState<"tasks" | "audit">("tasks")

    const pendingAudits = tasks.filter((t) => t.status === "completed").length

    return (
        <main className="min-h-screen bg-background relative overflow-hidden pb-20">
            <Header />

            {view === "tasks" ? <TaskFeed /> : <EnergyAudit />}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur pb-6 pt-2 px-6 z-40">
                <div className="flex items-center justify-around max-w-sm mx-auto">
                    <button
                        onClick={() => setView("tasks")}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors",
                            view === "tasks" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ListTodo className="w-6 h-6" />
                        <span className="text-[10px] font-medium tracking-wide">TASKS</span>
                    </button>

                    <button
                        onClick={() => setView("audit")}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors relative",
                            view === "audit" ? "text-energy-green" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <div className="relative">
                            <Layers className="w-6 h-6" />
                            {pendingAudits > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-energy-green opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-energy-green"></span>
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium tracking-wide">AUDIT</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {activeTaskId && <FocusMode taskId={activeTaskId} />}
            </AnimatePresence>
        </main>
    )
}
