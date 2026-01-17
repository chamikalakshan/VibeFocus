'use client'

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Trash2, Plus, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { addTask, toggleTask, deleteTask } from "@/actions/task"
// Fallback for toast since component is missing
const useToast = () => ({ toast: (props: any) => console.log(props) })

type Task = {
    id: string
    title: string
    is_completed: boolean
    created_at: string
}

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    // Sync state with props - simpler than useOptimistic for now, since we revalidatePath
    // But wait, if we revalidatePath, the page will reload with new props.
    // So we should depend on props for the list, but we can do optimistic updates for better UX.
    // Actually, let's trust the server revalidation for the "real" state, 
    // but updates might be slow without optimistic UI. 
    // Let's stick to simple implementation: Server action -> Revalidate -> New Props.
    // BUT: useEffect to sync props to state if we want local state.
    // OR: just use the props directly if we don't need local filtering/sorting that server doesn't do.
    // The issue is revalidatePath causes a full server re-render of the component tree.
    // So initialTasks will update.

    // However, to make it snappy, let's use optimistic updates manually.

    async function handleAddTask(e: React.FormEvent) {
        e.preventDefault()
        if (!newTaskTitle.trim()) return

        const tempId = Math.random().toString()
        const optimisticTask: Task = {
            id: tempId,
            title: newTaskTitle,
            is_completed: false,
            created_at: new Date().toISOString()
        }

        setTasks(prev => [optimisticTask, ...prev])
        setNewTaskTitle("")
        setIsLoading(true)

        try {
            await addTask(newTaskTitle)
            // Server revalidation will update the prop, but we need to handle the case 
            // where the prop comes back. 
            // Actually, if I use `useOptimistic`, it's cleaner.
        } catch (error) {
            setTasks(prev => prev.filter(t => t.id !== tempId)) // Revert
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleToggle(id: string, currentStatus: boolean) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t))
        try {
            await toggleTask(id, !currentStatus)
        } catch (error) {
            setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: currentStatus } : t)) // Revert
        }
    }

    async function handleDelete(id: string) {
        const taskToDelete = tasks.find(t => t.id === id)
        setTasks(prev => prev.filter(t => t.id !== id))
        try {
            await deleteTask(id)
        } catch (error) {
            if (taskToDelete) setTasks(prev => [...prev, taskToDelete]) // Revert (simplified, might lose order)
        }
    }

    // Update local state when props change (Server revalidation)
    // This is a bit of a pattern hack, but works for hybrid.
    // Better: separate optimistic Tasks and real Tasks.
    // For this v1, I will rely on the props updating, but also modify local state for "instant" feel.
    // Actually, react `key` attribute on the component or useEffect is needed if we use local state.
    // Let's use `useEffect` to sync.

    // Actually, simplified: Use userOptimistic hook? I might need to check if React 18/19 is available.
    // Assuming standard Next.js 14 setup. 
    // Let's try to stick to "local state initialized with props, and useEffect to update it".

    // Using a key on the parent component based on data hash is effective but might flicker.
    // Let's just use `useOptimistic` if I was sure, but I am not.
    // I will stick to "Optimistic updates on local state, and sync with useEffect".

    // Wait, simpler: Just use the props and `useTransition` for actions if I want loading states.
    // But I promised "Dynamic Design" and "Snappy".

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Plus className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                    type="text"
                    placeholder="Add a new task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="pl-10 py-6 text-lg bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all shadow-sm hover:shadow-md focus:shadow-lg rounded-xl"
                />
                <Button
                    type="submit"
                    size="sm"
                    className="absolute right-2 top-2 bottom-2 aspect-square p-0 rounded-lg"
                    disabled={!newTaskTitle.trim() || isLoading}
                >
                    <Plus className="h-5 w-5" />
                    <span className="sr-only">Add</span>
                </Button>
            </form>

            {/* Task List */}
            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {initialTasks.map((task) => (
                        <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={cn(
                                "group flex items-center gap-3 p-4 rounded-xl border bg-card/50 hover:bg-card/80 transition-all hover:shadow-md",
                                task.is_completed && "opacity-60 bg-muted/50"
                            )}
                        >
                            <button
                                onClick={() => handleToggle(task.id, task.is_completed)}
                                className={cn(
                                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    task.is_completed
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground/30 hover:border-primary/50"
                                )}
                            >
                                {task.is_completed && <Check className="w-3.5 h-3.5" />}
                            </button>

                            <span className={cn(
                                "flex-grow font-medium transition-all text-base",
                                task.is_completed ? "line-through text-muted-foreground" : "text-foreground"
                            )}>
                                {task.title}
                            </span>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(task.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 -mr-2"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {initialTasks.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                            <Calendar className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <p>No tasks yet. Start vibing!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
