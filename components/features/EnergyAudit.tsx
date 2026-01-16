"use client"

import { useState } from "react"
import { useVibe, Task } from "@/context/VibeContext"
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion"
import { Zap, BatteryWarning, BatteryCharging, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { logEnergy } from "@/actions/energy"

export function EnergyAudit() {
    const { tasks, auditTask } = useVibe()

    // Get tasks that are completed but not yet audited
    const tasksToAudit = tasks.filter((t) => t.status === "completed")

    // Sort by newest first or oldest? Probably oldest first to clear queue.
    const stack = tasksToAudit.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const handleAudit = async (taskId: string, energy: "green" | "red" | "yellow") => {
        // Map swipe direction to energy level (0-100)
        const levels = { green: 90, yellow: 50, red: 10 }

        try {
            // Log to separate analytics table
            await logEnergy(levels[energy])
        } catch (error) {
            console.error("Failed to log energy:", error)
        }

        // Mark task as audited in local state/DB
        auditTask(taskId, energy)
    }

    if (stack.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">All Audited!</h2>
                <p className="text-muted-foreground">Great job reflecting on your energy.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] w-full max-w-sm mx-auto relative pt-10">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-8">
                How did this feel?
            </h2>

            <div className="relative w-full h-80">
                <AnimatePresence>
                    {stack.map((task, index) => (
                        // Only render top 2 cards for performance
                        index >= stack.length - 2 ? (
                            <SwipeCard
                                key={task.id}
                                task={task}
                                isTop={index === stack.length - 1}
                                onSwipe={(energy) => handleAudit(task.id, energy)}
                            />
                        ) : null
                    ))}
                </AnimatePresence>
            </div>

            <div className="flex justify-between w-full max-w-xs mt-12 px-4">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full border border-red-500/50 flex items-center justify-center text-red-500">
                        <BatteryWarning className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-red-500">Draining</span>
                </div>

                <div className="flex flex-col items-center gap-2 -mt-8">
                    <div className="w-12 h-12 rounded-full border border-yellow-500/50 flex items-center justify-center text-yellow-500">
                        <Zap className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-yellow-500">Neutral</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full border border-green-500/50 flex items-center justify-center text-green-500">
                        <BatteryCharging className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-green-500">Energizing</span>
                </div>
            </div>
        </div>
    )
}

function SwipeCard({
    task,
    isTop,
    onSwipe
}: {
    task: Task
    isTop: boolean
    onSwipe: (e: "green" | "red" | "yellow") => void
}) {
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-25, 25])
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])

    // Background colors based on drag
    const bg = useTransform(
        x,
        [-150, 0, 150],
        ["rgb(239, 68, 68)", "rgb(24, 24, 27)", "rgb(34, 197, 94)"]
    )
    const borderColor = useTransform(
        y,
        [-150, 0],
        ["rgb(234, 179, 8)", "rgba(255, 255, 255, 0.1)"]
    )

    const handleDragEnd = (_: any, info: PanInfo) => {
        const threshold = 100
        if (info.offset.x > threshold) {
            onSwipe("green")
        } else if (info.offset.x < -threshold) {
            onSwipe("red")
        } else if (info.offset.y < -threshold) {
            onSwipe("yellow")
        }
    }

    return (
        <motion.div
            style={{
                x: isTop ? x : 0,
                y: isTop ? y : 0,
                rotate: isTop ? rotate : 0,
                opacity: isTop ? opacity : 1,
                zIndex: isTop ? 50 : 10,
                backgroundColor: isTop ? bg : "rgb(24, 24, 27)", // Only change color if top
                borderColor: isTop ? borderColor : "rgba(255, 255, 255, 0.1)"
            }}
            drag={isTop ? true : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: "grabbing" }}
            className={cn(
                "absolute inset-0 w-full h-full rounded-2xl border flex flex-col items-center justify-center p-8 text-center shadow-xl cursor-grab",
                !isTop && "scale-95 -translate-y-4 opacity-50"
            )}
        >
            <h3 className="text-2xl font-bold leading-tight">{task.title}</h3>
            <p className="absolute bottom-6 text-xs text-muted-foreground font-mono">
                Swipe Right (Good) / Left (Bad) / Up (Meh)
            </p>
        </motion.div>
    )
}
