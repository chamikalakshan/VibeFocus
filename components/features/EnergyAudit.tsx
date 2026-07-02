"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion"
import { ArrowLeft, ArrowRight, BatteryCharging, BatteryWarning, CheckCircle2, Clock3, RotateCcw, Sparkles, Tag, Zap } from "lucide-react"
import { useVibe } from "@/context/VibeContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/domain/presentation"
import { cn } from "@/lib/utils"

type Rating = "green" | "red" | "yellow"

export function EnergyAudit() {
  const { tasks, auditTask, clearAudit } = useVibe()
  const queue = tasks.filter((task) => task.status === "completed" && !task.energy)
  const task = queue[0]
  const [last, setLast] = useState<string | null>(null)
  const [exitDirection, setExitDirection] = useState<-1 | 0 | 1>(0)
  const busy = useRef(false)
  const audit = (rating: Rating) => {
    if (!task || busy.current) return
    busy.current = true
    setLast(task.id)
    setExitDirection(rating === "red" ? -1 : rating === "green" ? 1 : 0)
    window.setTimeout(() => {
      auditTask(task.id, rating)
      setExitDirection(0)
      busy.current = false
    }, 180)
  }
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === "ArrowLeft") audit("red")
      if (event.key === "ArrowUp") audit("yellow")
      if (event.key === "ArrowRight") audit("green")
    }
    window.addEventListener("keydown", keydown)
    return () => window.removeEventListener("keydown", keydown)
  })

  if (!task) return <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center"><div className="mb-5 flex size-20 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]"><CheckCircle2 className="size-10" /></div><h2 className="text-2xl font-semibold">All reflected</h2><p className="mt-2 text-muted-foreground">Your energy history is up to date.</p>{last && <Button className="mt-5" variant="outline" onClick={() => { clearAudit(last); setLast(null) }}><RotateCcw />Undo last audit</Button>}</div>

  const completed = tasks.filter((item) => item.status === "completed").length
  const reflected = completed - queue.length
  const progress = completed ? Math.round(reflected / completed * 100) : 100

  return <div className="mx-auto flex min-h-[65vh] w-full max-w-2xl flex-col justify-center gap-5">
    <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">One quick check-in</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">How did this task feel?</h2><p className="mt-1 text-sm text-muted-foreground">{queue.length} task{queue.length === 1 ? "" : "s"} waiting for reflection</p></div><span className="text-sm font-semibold text-primary">{progress}% reflected</span></div>
    <div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} /></div>
    <SwipeDeck queue={queue} exitDirection={exitDirection} onAudit={audit} />
    <p className="flex items-center justify-center gap-3 text-center text-xs font-medium text-muted-foreground"><span className="flex items-center gap-1"><ArrowLeft className="size-3.5" />Swipe left for draining</span><span aria-hidden>·</span><span className="flex items-center gap-1">Swipe right for energizing<ArrowRight className="size-3.5" /></span></p>
    <div className="grid grid-cols-3 gap-2">
      <AuditButton icon={BatteryWarning} label="Draining" hint="Left arrow" className="text-[var(--energy-low)]" onClick={() => audit("red")} />
      <AuditButton icon={Zap} label="Neutral" hint="Up arrow" className="text-[var(--energy-balanced)]" onClick={() => audit("yellow")} />
      <AuditButton icon={BatteryCharging} label="Energizing" hint="Right arrow" className="text-[var(--energy-high)]" onClick={() => audit("green")} />
    </div>
    {last && <Button variant="ghost" onClick={() => { clearAudit(last); setLast(null) }}><RotateCcw />Undo last audit</Button>}
  </div>
}

function SwipeDeck({ queue, exitDirection, onAudit }: { queue: ReturnType<typeof useVibe>["tasks"]; exitDirection: -1 | 0 | 1; onAudit: (rating: Rating) => void }) {
  const task = queue[0]
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-320, 0, 320], [-11, 0, 11])
  const energizingOpacity = useTransform(x, [35, 150], [0, 1])
  const drainingOpacity = useTransform(x, [-150, -35], [1, 0])

  return <div className="relative h-[22rem] w-full sm:h-[24rem]">
    {queue.slice(1, 3).reverse().map((nextTask, reversedIndex) => {
      const depth = queue.slice(1, 3).length - reversedIndex
      return <div key={nextTask.id} aria-hidden className="absolute inset-x-5 top-0 h-[20rem] rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] shadow-[var(--shadow-card)] sm:inset-x-8 sm:h-[22rem]" style={{ transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.035})`, opacity: 1 - depth * 0.2 }} />
    })}
    <AnimatePresence mode="popLayout">
      <motion.article
        key={task.id}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.85}
        onDragEnd={(_, info) => {
          if (info.offset.x > 110 || info.velocity.x > 650) onAudit("green")
          else if (info.offset.x < -110 || info.velocity.x < -650) onAudit("red")
        }}
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, x: exitDirection * 520, rotate: exitDirection * 15, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        style={{ x, rotate }}
        className="accent-glow absolute inset-x-0 top-0 flex h-[20rem] touch-pan-y cursor-grab flex-col overflow-hidden rounded-[2rem] border border-primary/20 bg-[var(--surface-primary)] p-5 active:cursor-grabbing sm:h-[22rem] sm:p-7"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,var(--accent-soft),transparent_48%)]" />
        <motion.div style={{ opacity: drainingOpacity }} className="pointer-events-none absolute left-5 top-5 z-20 -rotate-6 rounded-xl border-2 border-[var(--energy-low)] bg-[var(--energy-low-soft)] px-4 py-2 text-sm font-black uppercase tracking-[.15em] text-[var(--energy-low)]">Draining</motion.div>
        <motion.div style={{ opacity: energizingOpacity }} className="pointer-events-none absolute right-5 top-5 z-20 rotate-6 rounded-xl border-2 border-[var(--energy-high)] bg-[var(--energy-high-soft)] px-4 py-2 text-sm font-black uppercase tracking-[.15em] text-[var(--energy-high)]">Energizing</motion.div>
        <div className="relative z-10 flex items-center justify-between"><span className="flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-primary"><Sparkles className="size-3.5" />Energy reflection</span><span className="text-xs font-semibold text-muted-foreground">{queue.length} left</span></div>
        <div className="relative z-10 my-auto py-8 text-center"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">You completed</p><h3 className="mx-auto mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-[-.05em] sm:text-5xl">{task.title}</h3>{task.description && <p className="mx-auto mt-4 line-clamp-2 max-w-md text-sm leading-6 text-muted-foreground">{task.description}</p>}</div>
        <div className="relative z-10 flex flex-wrap justify-center gap-2">
          {task.category && <Badge variant="secondary"><Tag />{task.category}</Badge>}
          {formatDuration(task.estimated_minutes) && <Badge variant="outline"><Clock3 />{formatDuration(task.estimated_minutes)}</Badge>}
          <Badge variant="outline" className="capitalize">{task.priority ?? "medium"} priority</Badge>
        </div>
      </motion.article>
    </AnimatePresence>
  </div>
}

function AuditButton({ icon: Icon, label, hint, className, onClick }: { icon: typeof Zap; label: string; hint: string; className: string; onClick: () => void }) {
  return <button onClick={onClick} className={cn("dashboard-panel dashboard-panel-hover flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl p-3 font-semibold sm:min-h-28", className)}><Icon className="size-7" /><span>{label}</span><span className="hidden text-[10px] font-medium text-muted-foreground sm:block">{hint}</span></button>
}
