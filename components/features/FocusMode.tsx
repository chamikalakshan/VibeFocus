"use client"

import { useState, useEffect, useRef } from "react"
import { useVibe } from "@/context/VibeContext"
import { motion } from "framer-motion"
import { startFocusSession, updateFocusSession, type RestoredFocusSession } from "@/actions/focus"
import { pauseTimer, remainingSeconds, resumeTimer, type TimerState } from "@/lib/domain/timer"
import { builtinAudioSource, isFocusAudioSource, parseFocusAudioPreference, type FocusAudioSource } from "@/lib/domain/audio-source"
import { FocusAudioSourceDialog } from "@/components/features/FocusAudioSourceDialog"
import { FocusAudioPanel, FocusControls, FocusTimerHero, FocusTopBar, SessionDetailsPanel } from "@/components/features/FocusSessionUI"

const STORAGE_KEY = (id: string) => `vibefocus_timer_${id}`
const AUDIO_SOURCE_KEY = "vibefocus_focus_audio_source"
const AUDIO_PREFERENCE_KEY = "vibefocus_focus_audio_preference"

export function FocusMode({ taskId, restoredSession }: { taskId: string; restoredSession?: RestoredFocusSession | null }) {
    const { tasks, setActiveTaskId, completeTask, updateTaskTitle } = useVibe()
    const task = tasks.find((t) => t.id === taskId)

    // ── Restore persisted timer state on mount ──────────────────────────────
    const getInitialState = () => {
        const serverState = restoredSession ? {
            duration: restoredSession.plannedSeconds,
            timeLeft: restoredSession.remainingSeconds,
            timer: {
                status: restoredSession.status,
                endsAt: restoredSession.endsAt,
                remainingSeconds: restoredSession.remainingSeconds,
            } satisfies TimerState,
            sessionId: restoredSession.id,
        } : null
        if (serverState) return serverState
        try {
            const raw = localStorage.getItem(STORAGE_KEY(taskId))
            if (raw) {
                const saved = JSON.parse(raw) as {
                    duration: number
                    timeLeft?: number
                    isActive?: boolean
                    savedAt?: number
                    status?: TimerState["status"]
                    endsAt?: string | null
                    remainingSeconds?: number
                    sessionId?: string | null
                }
                const legacyRemaining = saved.timeLeft ?? 25 * 60
                const legacyEndsAt = saved.isActive && saved.savedAt
                    ? new Date(saved.savedAt + legacyRemaining * 1000).toISOString()
                    : null
                const timer: TimerState = {
                    status: saved.status ?? (saved.isActive ? "running" : "paused"),
                    endsAt: saved.endsAt ?? legacyEndsAt,
                    remainingSeconds: saved.remainingSeconds ?? legacyRemaining,
                }
                const restoredTimeLeft = remainingSeconds(timer)
                const localState = {
                    duration: saved.duration,
                    timeLeft: restoredTimeLeft,
                    timer: restoredTimeLeft > 0 ? timer : { status: "completed", endsAt: null, remainingSeconds: 0 } satisfies TimerState,
                    sessionId: saved.sessionId ?? null,
                }
                return localState
            }
        } catch { }
        return { duration: 25 * 60, timeLeft: 25 * 60, timer: { status: "paused", endsAt: null, remainingSeconds: 25 * 60 } satisfies TimerState, sessionId: null }
    }

    const [initial] = useState(getInitialState)
    const [duration, setDuration] = useState(initial.duration)
    const [timeLeft, setTimeLeft] = useState(initial.timeLeft)
    const [timer, setTimer] = useState<TimerState>(initial.timer)
    const [vibeOn, setVibeOn] = useState(false)
    const [volume, setVolume] = useState(0.45)
    const [audioSource, setAudioSource] = useState<FocusAudioSource>(builtinAudioSource)
    const [audioSourceLoaded, setAudioSourceLoaded] = useState(false)
    const [audioSourceOpen, setAudioSourceOpen] = useState(false)
    const volumeRef = useRef(volume)
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            try {
                const preference = parseFocusAudioPreference(JSON.parse(localStorage.getItem(AUDIO_PREFERENCE_KEY) ?? "null"))
                const legacySource = JSON.parse(localStorage.getItem(AUDIO_SOURCE_KEY) ?? "null")
                if (preference) {
                    setAudioSource(preference.source)
                    setVolume(preference.volume)
                    volumeRef.current = preference.volume
                } else if (isFocusAudioSource(legacySource)) {
                    setAudioSource(legacySource)
                }
            } catch { }
            setAudioSourceLoaded(true)
        }, 0)
        return () => window.clearTimeout(timeout)
    }, [])
    const [isDragging, setIsDragging] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState(task?.title || "")
    const [sessionId, setSessionId] = useState<string | null>(initial.sessionId)
    const [announcement, setAnnouncement] = useState("")
    const isActive = timer.status === "running"

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const ringRef = useRef<HTMLDivElement>(null)

    const progress = isActive
        ? timeLeft / duration
        : duration / (60 * 60)
    const sandProgress = timeLeft / duration

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY(taskId), JSON.stringify({
                duration,
                ...timer,
                remainingSeconds: timeLeft,
                sessionId,
            }))
        } catch { }
    }, [taskId, duration, timeLeft, timer, sessionId])

    useEffect(() => {
        if (!isActive) return
        const tick = () => setTimeLeft(remainingSeconds(timer))
        tick()
        const interval = window.setInterval(tick, 250)
        return () => window.clearInterval(interval)
    }, [isActive, timer])

    useEffect(() => {
        if (timeLeft === 0 && timer.status === "running") {
            const timeout = window.setTimeout(() => {
                setTimer({ status: "completed", endsAt: null, remainingSeconds: 0 })
                setVibeOn(false)
                setAnnouncement("Focus timer completed.")
                if (sessionId) void updateFocusSession(sessionId, "completed", 0)
                try { localStorage.removeItem(STORAGE_KEY(taskId)) } catch { }
            }, 0)
            return () => window.clearTimeout(timeout)
        }
    }, [timeLeft, taskId, timer.status, sessionId])

    useEffect(() => {
        if (!audioSourceLoaded) return
        try {
            localStorage.setItem(AUDIO_SOURCE_KEY, JSON.stringify(audioSource))
            localStorage.setItem(AUDIO_PREFERENCE_KEY, JSON.stringify({ version: 1, source: audioSource, volume: volumeRef.current }))
        } catch { }
    }, [audioSource, audioSourceLoaded])

    const updateVolume = (nextVolume: number) => {
        volumeRef.current = nextVolume
        setVolume(nextVolume)
        if (!audioSourceLoaded) return
        try {
            localStorage.setItem(AUDIO_PREFERENCE_KEY, JSON.stringify({ version: 1, source: audioSource, volume: nextVolume }))
        } catch { }
    }

    useEffect(() => {
        if (audioSource.kind !== "builtin") {
            audioRef.current?.pause()
            return
        }
        if (audioRef.current) audioRef.current.volume = volume
        if (vibeOn && isActive) {
            audioRef.current?.play().catch(() => { })
        } else {
            audioRef.current?.pause()
        }
    }, [audioSource.kind, vibeOn, isActive, volume])

    const close = () => {
        if (isActive && !window.confirm("Leave this focus session? Your timer will remain saved so you can return.")) return
        setActiveTaskId(null)
    }
    const reset = () => {
        if (isActive && !window.confirm("Reset this focus timer?")) return
        setTimeLeft(duration)
        setTimer({ status: "paused", endsAt: null, remainingSeconds: duration })
        setAnnouncement("Focus timer reset.")
        if (sessionId) void updateFocusSession(sessionId, "cancelled", timeLeft)
        setSessionId(null)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const handleComplete = () => {
        try { localStorage.removeItem(STORAGE_KEY(taskId)) } catch { }
        setTimer({ status: "completed", endsAt: null, remainingSeconds: timeLeft })
        setAnnouncement("Task completed.")
        completeTask(taskId)
        if (sessionId) void updateFocusSession(sessionId, "completed", timeLeft)
        setActiveTaskId(null)
    }

    const toggleTimer = async () => {
        const nextTimer = isActive
            ? pauseTimer(timer)
            : resumeTimer({ ...timer, status: "paused", remainingSeconds: timeLeft })
        if (!isActive && !sessionId) {
            try { setSessionId(await startFocusSession(taskId, duration)) } catch { /* local timer remains available offline */ }
        } else if (sessionId) {
            try { await updateFocusSession(sessionId, isActive ? "paused" : "running", timeLeft) } catch { /* sync can retry later */ }
        }
        setTimeLeft(remainingSeconds(nextTimer))
        setTimer(nextTimer)
        setAnnouncement(isActive ? "Focus timer paused." : "Focus timer started.")
    }

    const handleTitleSave = () => {
        if (title.trim() && task && title !== task.title) {
            updateTaskTitle(taskId, title)
        }
        setIsEditing(false)
    }

    const editDuration = () => {
        const value = window.prompt("Focus duration in minutes", String(Math.round(duration / 60)))
        if (!value) return
        const minutes = Math.max(1, Math.min(60, Number.parseInt(value, 10)))
        if (!Number.isFinite(minutes)) return
        const seconds = minutes * 60
        setDuration(seconds)
        setTimeLeft(seconds)
        setTimer({ status: "paused", endsAt: null, remainingSeconds: seconds })
    }

    const toggleFullscreen = () => {
        if (document.fullscreenElement) void document.exitFullscreen()
        else void document.documentElement.requestFullscreen()
    }

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null
            if (target?.matches("input, textarea, select, button, a, [contenteditable=true]")) return
            if (event.code === "Space") { event.preventDefault(); void toggleTimer() }
            if (event.key === "Enter") { event.preventDefault(); handleComplete() }
            if (event.key.toLowerCase() === "r") { event.preventDefault(); reset() }
            if (event.key === "Escape") close()
        }
        window.addEventListener("keydown", handleShortcut)
        return () => window.removeEventListener("keydown", handleShortcut)
    })

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
        setTimer({ status: "paused", endsAt: null, remainingSeconds: newSeconds })
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="focus-backdrop fixed inset-0 z-50 overflow-y-auto p-3 text-foreground select-none sm:p-4">
            <p className="sr-only" aria-live="polite">{announcement}</p>
            <div className="mx-auto flex min-h-full w-full max-w-[1600px] flex-col gap-4">
                <FocusTopBar onExit={close} onSettings={() => setAudioSourceOpen(true)} onFullscreen={toggleFullscreen} />
                <div className="grid flex-1 items-center gap-4 py-2 md:grid-cols-2 lg:grid-cols-[minmax(15rem,21rem)_minmax(29rem,1fr)_minmax(16rem,22rem)] lg:gap-6">
                    <SessionDetailsPanel task={task} duration={duration} canEdit={!isActive} onEditTask={() => setIsEditing(true)} onEditDuration={editDuration} />
                    <div className="order-first flex flex-col items-center md:col-span-2 lg:order-none lg:col-span-1">
                        <FocusTimerHero title={task.title} time={formatTime(timeLeft)} progress={progress} sandProgress={sandProgress} isActive={isActive} isEditing={isEditing} editedTitle={title} onEditedTitleChange={setTitle} onEditStart={() => !isActive && setIsEditing(true)} onEditSave={handleTitleSave} ringRef={ringRef} ringHandlers={{ onMouseDown, onMouseMove, onTouchStart, onTouchMove }} />
                        <FocusControls isActive={isActive} onToggle={() => void toggleTimer()} onComplete={handleComplete} onReset={reset} />
                    </div>
                    <FocusAudioPanel source={audioSource} enabled={vibeOn} active={isActive} volume={volume} onEnabledChange={setVibeOn} onVolumeChange={updateVolume} onSourceChange={setAudioSource} onOpenSettings={() => setAudioSourceOpen(true)} />
                </div>
            </div>
            <FocusAudioSourceDialog open={audioSourceOpen} onOpenChange={setAudioSourceOpen} source={audioSource} onSourceChange={(source) => { setAudioSource(source); setVibeOn(true) }} />
            <audio
                ref={audioRef}
                loop
                src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112762.mp3"
                className="hidden"
            />
        </motion.div>
    )
}
