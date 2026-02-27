"use client"

import { useState, useEffect } from "react"
import { useVibe, Task } from "@/context/VibeContext"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, MoreVertical, Play, Pencil, Trash2, Check, X, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TaskFeed({
    hideCompleted = false,
    hideOlderThanHours,
    showViewAll = true,
}: {
    hideCompleted?: boolean
    hideOlderThanHours?: number
    showViewAll?: boolean
}) {
    const { tasks, completeTask, setActiveTaskId, deleteTask, updateTaskTitle } = useVibe()
    const router = useRouter()

    const cutoff = hideOlderThanHours
        ? Date.now() - hideOlderThanHours * 60 * 60 * 1000
        : null


    // Sort: Pending first, then by date
    const sortedTasks = [...tasks]
        .filter((t) => !hideCompleted || (t.status !== "completed" && t.status !== "audited"))
        .filter((t) => !cutoff || new Date(t.created_at).getTime() >= cutoff)
        .sort((a, b) => {
            if (a.status === b.status) {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            }
            return a.status === "pending" ? -1 : 1
        })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Your Flow</h2>
                <div className="flex items-center gap-2">

                    {showViewAll && (
                        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => router.push("/dashboard/tasks")}>
                            View All
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {sortedTasks.map((task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onComplete={() => completeTask(task.id)}
                            onFocus={() => setActiveTaskId(task.id)}
                            onDelete={() => deleteTask(task.id)}
                            onEdit={(title) => updateTaskTitle(task.id, title)}
                        />
                    ))}
                    {sortedTasks.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-10"
                        >
                            <p className="text-muted-foreground">No vibes yet. Add a task to get started.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

function TaskItem({
    task,
    onComplete,
    onFocus,
    onDelete,
    onEdit,
}: {
    task: Task
    onComplete: () => void
    onFocus: () => void
    onDelete: () => void
    onEdit: (title: string) => void
}) {
    const isCompleted = task.status === "completed" || task.status === "audited"
    const [editing, setEditing] = useState(false)
    const [editValue, setEditValue] = useState(task.title)

    // ── Live countdown from localStorage ──────────────────────────────────
    const [timerDisplay, setTimerDisplay] = useState<string | null>(null)
    const [timerRunning, setTimerRunning] = useState(false)

    useEffect(() => {
        const STORAGE_KEY = `vibefocus_timer_${task.id}`
        const tick = () => {
            try {
                const raw = localStorage.getItem(STORAGE_KEY)
                if (!raw) { setTimerDisplay(null); setTimerRunning(false); return }
                const saved = JSON.parse(raw) as { timeLeft: number; isActive: boolean; savedAt: number }
                let t = saved.timeLeft
                if (saved.isActive) {
                    const elapsed = Math.floor((Date.now() - saved.savedAt) / 1000)
                    t = Math.max(0, saved.timeLeft - elapsed)
                }
                const mins = Math.floor(t / 60).toString().padStart(2, "0")
                const secs = (t % 60).toString().padStart(2, "0")
                setTimerDisplay(`${mins}:${secs}`)
                setTimerRunning(saved.isActive && t > 0)
            } catch {
                setTimerDisplay(null)
                setTimerRunning(false)
            }
        }
        tick() // immediate
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [task.id])

    const handleSaveEdit = () => {
        if (editValue.trim() && editValue.trim() !== task.title) {
            onEdit(editValue.trim())
        }
        setEditing(false)
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "group relative flex items-center gap-4 p-4 rounded-2xl border bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80",
                isCompleted && "opacity-60 bg-secondary/30"
            )}
        >
            <button
                onClick={onComplete}
                className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    isCompleted
                        ? "bg-green-500 border-green-500 text-black"
                        : "border-muted-foreground/30 hover:border-green-500/50"
                )}
            >
                {isCompleted && <CheckCircle2 className="w-4 h-4" />}
            </button>

            <div className="flex-1 min-w-0">
                {editing ? (
                    <div className="flex items-center gap-2">
                        <Input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit()
                                if (e.key === "Escape") { setEditValue(task.title); setEditing(false) }
                            }}
                            className="h-8 text-sm bg-secondary/50"
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={handleSaveEdit}>
                            <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => { setEditValue(task.title); setEditing(false) }}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div>
                        <h3 className={cn(
                            "font-medium truncate transition-all",
                            isCompleted && "line-through text-muted-foreground"
                        )}>
                            {task.title}
                        </h3>
                        {timerDisplay && (
                            <span className={cn(
                                "inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded-full font-mono",
                                timerRunning
                                    ? "bg-primary/10 text-primary animate-pulse"
                                    : "bg-secondary/50 text-muted-foreground"
                            )}>
                                <Timer className="w-3 h-3" />
                                {timerDisplay}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {!isCompleted && !editing && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="sm"
                        className="h-8 rounded-full px-4 bg-primary/10 text-primary hover:bg-primary/20 border-0"
                        onClick={onFocus}
                    >
                        <Play className="w-3 h-3 mr-2 fill-current" />
                        Focus
                    </Button>
                </div>
            )}

            {!editing && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditValue(task.title); setEditing(true) }} className="gap-2">
                            <Pencil className="w-4 h-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="text-red-500 gap-2">
                            <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </motion.div>
    )
}
