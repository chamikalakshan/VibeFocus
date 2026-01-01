"use client"

import { useState } from "react"
import { useVibe, Task } from "@/context/VibeContext"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Sparkles, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function TaskFeed() {
    const { tasks, addTask, addTasksBulk, setActiveTaskId } = useVibe()
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [isAiMode, setIsAiMode] = useState(false)
    const [aiInput, setAiInput] = useState("")

    const pendingTasks = tasks.filter((t) => t.status === "pending")

    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskTitle.trim()) return
        addTask(newTaskTitle)
        setNewTaskTitle("")
    }

    const handleAiImport = () => {
        if (!aiInput.trim()) return
        const lines = aiInput.split(/\r?\n/).filter((line) => line.trim().length > 0)
        addTasksBulk(lines)
        setAiInput("")
        setIsAiMode(false)
    }

    return (
        <div className="flex flex-col h-full w-full max-w-md mx-auto pb-24 px-4 pt-20">
            {/* Task List */}
            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                <AnimatePresence mode="popLayout">
                    {pendingTasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground"
                        >
                            <Sparkles className="w-12 h-12 mb-4 text-yellow-400 opacity-50" />
                            <p>No vibes pending.</p>
                            <p className="text-sm">Add tasks to get flowing.</p>
                        </motion.div>
                    ) : (
                        pendingTasks.map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onClick={() => setActiveTaskId(task.id)}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="fixed bottom-24 left-0 right-0 px-4 max-w-md mx-auto z-40">
                <AnimatePresence>
                    {isAiMode ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-card border border-border rounded-xl p-4 shadow-2xl mb-2"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" /> AI Import
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setIsAiMode(false)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <Textarea
                                placeholder="Paste list (e.g.&#10;9am Gym&#10;10am Code)"
                                className="min-h-[100px] mb-2 bg-background/50 resize-none"
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                            />
                            <Button onClick={handleAiImport} className="w-full">
                                Import Tasks
                            </Button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleQuickAdd} className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="rounded-xl h-12 w-12 shrink-0 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10"
                                onClick={() => setIsAiMode(true)}
                            >
                                <Sparkles className="w-5 h-5 text-purple-400" />
                            </Button>
                            <div className="relative flex-1">
                                <Input
                                    className="h-12 rounded-xl bg-card/80 backdrop-blur border-border pr-12 shadow-lg focus-visible:ring-offset-0 focus-visible:ring-purple-500/50"
                                    placeholder="Add a new task..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    variant="ghost"
                                    className="absolute right-1 top-1 h-10 w-10 hover:bg-transparent"
                                    disabled={!newTaskTitle.trim()}
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.9, rotate: -10 }}
                                        animate={{
                                            scale: newTaskTitle.trim() ? 1 : 0.8,
                                            opacity: newTaskTitle.trim() ? 1 : 0.5,
                                        }}
                                    >
                                        <div className="bg-primary text-primary-foreground rounded-full p-2">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                    </motion.div>
                                </Button>
                            </div>
                        </form>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

function TaskItem({ task, onClick }: { task: Task; onClick: () => void }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            whileTap={{ scale: 0.98 }}
        >
            <Card
                onClick={onClick}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors border-border/50 group"
            >
                <div className="flex items-center justify-between">
                    <span className="font-medium text-lg leading-tight group-hover:text-primary transition-colors">
                        {task.title}
                    </span>
                    <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                        <div className="w-0 h-0 bg-primary rounded-full group-hover:w-4 group-hover:h-4 transition-all duration-300" />
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}
