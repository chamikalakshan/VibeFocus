"use client"

import { useVibe, Task } from "@/context/VibeContext"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, MoreVertical, Play, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TaskFeed() {
    const { tasks, completeTask, setActiveTaskId } = useVibe()

    // Sort: Pending first, then by date
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.status === b.status) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return a.status === "pending" ? -1 : 1
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Your Flow</h2>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                    View All
                </Button>
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {sortedTasks.map((task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onComplete={() => completeTask(task.id)}
                            onFocus={() => setActiveTaskId(task.id)}
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
    onFocus
}: {
    task: Task
    onComplete: () => void
    onFocus: () => void
}) {
    const isCompleted = task.status === "completed" || task.status === "audited"

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
                <h3 className={cn(
                    "font-medium truncate transition-all",
                    isCompleted && "line-through text-muted-foreground"
                )}>
                    {task.title}
                </h3>
            </div>

            {!isCompleted && (
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

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </motion.div>
    )
}
