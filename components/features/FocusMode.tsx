"use client"

import { useState, useEffect, useRef } from "react"
import { useVibe, Task } from "@/context/VibeContext"
import { motion } from "framer-motion"
import { X, Play, Pause, Check, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function FocusMode({ taskId }: { taskId: string }) {
    const { tasks, setActiveTaskId, completeTask } = useVibe()
    const task = tasks.find((t) => t.id === taskId)

    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [isActive, setIsActive] = useState(false)
    const [vibeOn, setVibeOn] = useState(false)

    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Basic timer logic
        let interval: NodeJS.Timeout
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
        } else if (timeLeft === 0) {
            setIsActive(false)
            // Timer finished
        }
        return () => clearInterval(interval)
    }, [isActive, timeLeft])

    useEffect(() => {
        if (vibeOn) {
            audioRef.current?.play()
        } else {
            audioRef.current?.pause()
        }
    }, [vibeOn])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const handleComplete = () => {
        completeTask(taskId)
        setActiveTaskId(null) // Exit Focus Mode
    }

    if (!task) return null

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-6"
        >
            <div className="absolute top-6 left-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveTaskId(null)}
                    className="rounded-full hover:bg-muted"
                >
                    <X className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex flex-col items-center gap-8 max-w-md w-full">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-medium text-muted-foreground uppercase tracking-widest">
                        Now Focusing On
                    </h2>
                    <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                        {task.title}
                    </h1>
                </div>

                {/* Timer Display */}
                <div className="relative w-64 h-64 flex items-center justify-center rounded-full bg-secondary/20 shadow-[0_0_40px_rgba(255,255,255,0.05)] border border-white/5">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    {/* Animated progress ring could go here */}
                    <span className="text-6xl font-mono font-bold tracking-tighter">
                        {formatTime(timeLeft)}
                    </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                    <Button
                        size="lg"
                        className="h-16 w-16 rounded-full text-xl"
                        onClick={() => setIsActive(!isActive)}
                    >
                        {isActive ? <Pause className="fill-current" /> : <Play className="fill-current ml-1" />}
                    </Button>

                    <Button
                        size="lg"
                        className="h-16 px-8 rounded-full bg-energy-green text-black hover:bg-energy-green/90 font-bold"
                        onClick={handleComplete}
                    >
                        <Check className="w-5 h-5 mr-2" /> Complete
                    </Button>
                </div>

                {/* Vibe Switch */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border mt-8">
                    <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
                        <Music className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">Vibe Switch</span>
                        <span className="text-xs text-muted-foreground">{vibeOn ? "Lo-Fi Beats (Playing)" : "Focus Music (Off)"}</span>
                    </div>
                    <Switch
                        checked={vibeOn}
                        onCheckedChange={setVibeOn}
                        className="data-[state=checked]:bg-purple-600"
                    />
                </div>
            </div>

            <audio
                ref={audioRef}
                loop
                src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112762.mp3"
                // Placeholder LoFi track
                className="hidden"
            />
        </motion.div>
    )
}
