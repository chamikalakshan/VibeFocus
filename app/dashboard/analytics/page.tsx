"use client"

import { useVibe } from "@/context/VibeContext"
import { motion } from "framer-motion"
import {
    CheckCircle2,
    Zap,
    Clock,
    TrendingUp,
    Flame,
    Target,
    BarChart2,
    Smile,
    Meh,
    Frown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ─── helpers ────────────────────────────────────────────────────────────────

function getLast7Days() {
    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toISOString().split("T")[0] // "YYYY-MM-DD"
    })
}

function getDayLabel(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short" })
}

// ─── stat card ───────────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    color,
    delay = 0,
}: {
    icon: React.ElementType
    label: string
    value: string | number
    sub?: string
    color: string
    delay?: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
        >
            <Card className="bg-card/50 backdrop-blur border-white/5 hover:bg-card/80 transition-all">
                <CardContent className="p-6 flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-muted-foreground text-sm">{label}</p>
                        <p className="text-3xl font-bold mt-0.5">{value}</p>
                        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

// ─── mini bar ────────────────────────────────────────────────────────────────

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max === 0 ? 0 : Math.round((value / max) * 100)
    return (
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
                className={`h-full rounded-full ${color}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            />
        </div>
    )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const { tasks, streak } = useVibe()

    // ── derived stats ────────────────────────────────────────────────────────
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === "completed" || t.status === "audited").length
    const pending = tasks.filter((t) => t.status === "pending").length
    const audited = tasks.filter((t) => t.status === "audited").length
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100)

    const energyGreen = tasks.filter((t) => t.energy === "green").length
    const energyYellow = tasks.filter((t) => t.energy === "yellow").length
    const energyRed = tasks.filter((t) => t.energy === "red").length
    const energyTotal = energyGreen + energyYellow + energyRed

    // ── weekly activity ──────────────────────────────────────────────────────
    const last7 = getLast7Days()
    const weeklyData = last7.map((day) => ({
        label: getDayLabel(day),
        created: tasks.filter((t) => t.created_at.startsWith(day)).length,
        completed: tasks.filter(
            (t) => t.created_at.startsWith(day) && (t.status === "completed" || t.status === "audited")
        ).length,
    }))
    const maxBar = Math.max(...weeklyData.map((d) => d.created), 1)

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
            >
                <p className="text-muted-foreground uppercase tracking-widest text-xs font-medium">
                    Overview
                </p>
                <h1 className="text-4xl font-bold tracking-tight">Analytics</h1>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Target}
                    label="Total Tasks"
                    value={total}
                    sub="All time"
                    color="bg-primary/10 text-primary"
                    delay={0}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Completed"
                    value={completed}
                    sub={`${completionRate}% rate`}
                    color="bg-green-500/10 text-green-400"
                    delay={0.08}
                />
                <StatCard
                    icon={Clock}
                    label="Pending"
                    value={pending}
                    sub="In queue"
                    color="bg-yellow-500/10 text-yellow-400"
                    delay={0.16}
                />
                <StatCard
                    icon={Flame}
                    label="Streak"
                    value={streak}
                    sub="audited tasks"
                    color="bg-orange-500/10 text-orange-400"
                    delay={0.24}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Weekly Activity Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="md:col-span-8"
                >
                    <Card className="bg-card/50 backdrop-blur border-white/5 h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-primary" />
                                Weekly Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-3 h-40 pt-4">
                                {weeklyData.map((day, i) => {
                                    const heightPct = maxBar === 0 ? 0 : (day.created / maxBar) * 100
                                    const completedPct = day.created === 0 ? 0 : (day.completed / day.created) * 100
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                            <div className="w-full flex flex-col justify-end" style={{ height: "120px" }}>
                                                <div className="relative w-full rounded-t-md overflow-hidden bg-white/5" style={{ height: `${Math.max(heightPct, 4)}%` }}>
                                                    <motion.div
                                                        className="absolute bottom-0 left-0 right-0 bg-primary/60 rounded-t-md"
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${completedPct}%` }}
                                                        transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{day.label}</span>
                                            <span className="text-xs font-semibold">{day.created}</span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white/10 inline-block" /> Total</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/60 inline-block" /> Completed</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Completion Rate Ring */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="md:col-span-4"
                >
                    <Card className="bg-card/50 backdrop-blur border-white/5 h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                Completion Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-6 gap-6">
                            {/* Ring */}
                            <div className="relative w-36 h-36">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                                    <motion.circle
                                        cx="50" cy="50" r="40"
                                        fill="none"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - completionRate / 100) }}
                                        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold">{completionRate}%</span>
                                    <span className="text-xs text-muted-foreground">done</span>
                                </div>
                            </div>
                            <div className="w-full space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Completed</span>
                                    <span className="font-medium text-green-400">{completed}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Pending</span>
                                    <span className="font-medium text-yellow-400">{pending}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Audited</span>
                                    <span className="font-medium text-primary">{audited}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Energy Breakdown */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
            >
                <Card className="bg-card/50 backdrop-blur border-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            Energy Audit Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-2">
                        {energyTotal === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-4">
                                No audited tasks yet. Complete &amp; audit tasks to see your energy patterns.
                            </p>
                        ) : (
                            <>
                                {/* Green */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-green-400">
                                            <Smile className="w-4 h-4" /> High Energy
                                        </span>
                                        <span className="font-semibold">{energyGreen} <span className="text-muted-foreground font-normal">tasks</span></span>
                                    </div>
                                    <MiniBar value={energyGreen} max={energyTotal} color="bg-green-500" />
                                </div>
                                {/* Yellow */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-yellow-400">
                                            <Meh className="w-4 h-4" /> Medium Energy
                                        </span>
                                        <span className="font-semibold">{energyYellow} <span className="text-muted-foreground font-normal">tasks</span></span>
                                    </div>
                                    <MiniBar value={energyYellow} max={energyTotal} color="bg-yellow-500" />
                                </div>
                                {/* Red */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-red-400">
                                            <Frown className="w-4 h-4" /> Low Energy
                                        </span>
                                        <span className="font-semibold">{energyRed} <span className="text-muted-foreground font-normal">tasks</span></span>
                                    </div>
                                    <MiniBar value={energyRed} max={energyTotal} color="bg-red-500" />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
