"use client"

import { useState, useEffect, useRef } from "react"
import { useVibe } from "@/context/VibeContext"
import { motion } from "framer-motion"
import { X, Play, Pause, Check, Music, RotateCcw, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function FocusMode({ taskId }: { taskId: string }) {
    const { tasks, setActiveTaskId, completeTask, updateTaskTitle } = useVibe()
    console.log("VibeContext values:", { hasUpdateTask: !!updateTaskTitle, updateTaskTitle })
    const task = tasks.find((t) => t.id === taskId)

    const [duration, setDuration] = useState(25 * 60) // Default 25m
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [isActive, setIsActive] = useState(false)
    const [vibeOn, setVibeOn] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState(task?.title || "")

    useEffect(() => {
        if (task) setTitle(task.title)
    }, [task?.title])

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const ringRef = useRef<HTMLDivElement>(null)

    // SVG Circle Props
    const radius = 120
    const circumference = 2 * Math.PI * radius

    // When active, progress is based on time left (0 to 1). 
    // When dragging/setting, it's based on how much of 60m is selected (0 to 1).
    const progress = isActive
        ? timeLeft / duration   // Active: Depletes from 1 to 0 based on session length
        : duration / (60 * 60)  // Inactive: Shows how much of 60m dial is filled

    const dashOffset = circumference * (1 - progress)

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
        } else if (timeLeft === 0) {
            setIsActive(false)
            setVibeOn(false)
        }
        return () => clearInterval(interval)
    }, [isActive, timeLeft])

    useEffect(() => {
        if (vibeOn && isActive) {
            audioRef.current?.play().catch(() => { })
        } else {
            audioRef.current?.pause()
        }
    }, [vibeOn, isActive])

    const handleReset = () => {
        setIsActive(false)
        setDuration(25 * 60)
        setTimeLeft(25 * 60)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const handleComplete = () => {
        completeTask(taskId)
        setActiveTaskId(null)
    }

    const handleTitleSave = () => {
        if (title.trim() && task && title !== task.title) {
            updateTaskTitle(taskId, title)
        }
        setIsEditing(false)
    }

    // Interaction Logic for Circular Slider
    const handleInteraction = (clientX: number, clientY: number) => {
        if (!ringRef.current || isActive) return

        const rect = ringRef.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2

        // Calculate angle from center (0 is top, clockwise)
        const dx = clientX - cx
        const dy = clientY - cy

        // atan2 returns angle in radians from -PI to PI
        // -PI/2 is top (0 deg for us)
        let angle = Math.atan2(dy, dx)

        // Convert to 0-360 degrees starting from top
        // Standard atan2: 0 is right, -PI/2 is top.
        // We want Top=0. 
        // angle + PI/2 rotates so Top=0
        angle = angle + Math.PI / 2

        if (angle < 0) {
            angle += 2 * Math.PI
        }

        // Angle 0 to 2PI maps to 0 to 60 minutes
        const percentage = angle / (2 * Math.PI)
        const totalMinutes = 60
        const minutes = Math.round(percentage * totalMinutes)

        // Snap to nearest minute, min 1m
        const effectiveMins = Math.max(1, minutes === 0 ? 60 : minutes)

        const newSeconds = effectiveMins * 60
        setDuration(newSeconds)
        setTimeLeft(newSeconds)
    }

    const onMouseDown = (e: React.MouseEvent) => {
        if (isActive) return
        setIsDragging(true)
        handleInteraction(e.clientX, e.clientY)
    }

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        handleInteraction(e.clientX, e.clientY)
    }

    const onMouseUp = () => setIsDragging(false)
    const onTouchStart = (e: React.TouchEvent) => {
        if (isActive) return
        setIsDragging(true)
        handleInteraction(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return
        handleInteraction(e.touches[0].clientX, e.touches[0].clientY)
    }

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mouseup', onMouseUp)
            window.addEventListener('touchend', onMouseUp)
        }
        return () => {
            window.removeEventListener('mouseup', onMouseUp)
            window.removeEventListener('touchend', onMouseUp)
        }
    }, [isDragging])

    if (!task) return null

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md p-6 select-none"
        >
            <div className="absolute top-6 left-6">
                <Button variant="ghost" size="icon" onClick={() => setActiveTaskId(null)} className="rounded-full hover:bg-muted">
                    <X className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex flex-col items-center gap-8 max-w-md w-full">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-medium text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
                        <Timer className="w-4 h-4" /> Focus Session
                    </h2>
                    {isEditing ? (
                        <input
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                            className="text-3xl md:text-4xl font-bold bg-transparent text-white text-center w-full outline-none border-b border-white/20 pb-2"
                        />
                    ) : (
                        <h1
                            onClick={() => !isActive && setIsEditing(true)}
                            className={cn(
                                "text-3xl md:text-4xl font-bold bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity",
                                isActive && "cursor-default hover:opacity-100"
                            )}
                        >
                            {task.title}
                        </h1>
                    )}
                </div>

                {/* Interactive Timer Display */}
                <div
                    ref={ringRef}
                    className={cn(
                        "relative w-[300px] h-[300px] flex items-center justify-center rounded-full transition-shadow duration-300",
                        !isActive && "cursor-pointer hover:shadow-[0_0_30px_rgba(74,222,128,0.2)]"
                    )}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                >
                    {/* SVG Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(74,222,128,0.3)] pointer-events-none">
                        {/* Background track */}
                        <circle
                            cx="150"
                            cy="150"
                            r={radius}
                            className="stroke-secondary/20 fill-none"
                            strokeWidth="12"
                        />
                        {/* Animated Red Progress */}
                        <circle
                            cx="150"
                            cy="150"
                            r={radius}
                            className="stroke-energy-green fill-none"
                            strokeWidth="12"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: dashOffset,
                                transition: isActive ? "stroke-dashoffset 1s linear" : "none"
                            }}
                        />
                    </svg>

                    {/* We use a separate div for the visual knob to make rotation easier */}
                    {!isActive && (
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ transform: `rotate(${progress * 360}deg)` }}
                        >
                            <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        </div>
                    )}

                    <div className="flex flex-col items-center z-10 pointer-events-none">
                        <span className="text-7xl font-mono font-bold tracking-tighter tabular-nums text-foreground drop-shadow-2xl">
                            {formatTime(timeLeft)}
                        </span>
                        {!isActive && (
                            <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wide">
                                Drag ring to set
                            </span>
                        )}
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center gap-6 mt-4">
                    <Button
                        size="lg"
                        className={cn(
                            "h-20 w-20 rounded-full text-2xl shadow-lg transition-all hover:scale-105 active:scale-95 border-4 border-transparent z-10",
                            isActive
                                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                                : "bg-energy-green hover:bg-energy-green/90 text-black shadow-energy-green/30 border-energy-green/20"
                        )}
                        onClick={() => setIsActive(!isActive)}
                    >
                        {isActive ? <Pause className="fill-current w-8 h-8" /> : <Play className="fill-current ml-1 w-8 h-8" />}
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        className="h-16 px-8 rounded-full border-2 border-energy-green/50 text-energy-green hover:bg-energy-green hover:text-white font-bold transition-all"
                        onClick={handleComplete}
                    >
                        <Check className="w-5 h-5 mr-2" /> Complete
                    </Button>
                </div>

                {/* Vibe Switch */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 backdrop-blur border border-white/5 mt-4 w-full max-w-xs transition-opacity hover:bg-secondary/40">
                    <div className={cn(
                        "p-3 rounded-full transition-colors",
                        vibeOn ? "bg-purple-500/20 text-purple-400" : "bg-muted text-muted-foreground"
                    )}>
                        <Music className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col flex-1">
                        <span className="font-semibold text-sm">Lo-Fi Radio</span>
                        <span className="text-xs text-muted-foreground">
                            {vibeOn ? "Beats to study to" : "Simple ambiance"}
                        </span>
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
                className="hidden"
            />
        </motion.div>
    )
}
