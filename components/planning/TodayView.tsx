"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, BatteryFull, BatteryLow, BatteryMedium, CalendarDays, Check, CheckCircle2, ChevronDown, CircleDot, Clock3, Flame, ListChecks, Play, Plus, Sparkles, Target } from "lucide-react"
import { saveEnergyCheckin } from "@/actions/energy"
import { useVibe, type Task as ContextTask } from "@/context/VibeContext"
import { rankTodayTasks } from "@/lib/domain/planning"
import { formatDueDate, groupTodayTasks, priorityMeta } from "@/lib/domain/presentation"
import type { RequiredEnergy, Task } from "@/lib/domain/types"
import { Page } from "@/components/ui/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const levels = [
  { value: "low", label: "Low", icon: BatteryLow },
  { value: "medium", label: "Balanced", icon: BatteryMedium },
  { value: "high", label: "High", icon: BatteryFull },
] as const

const views = ["All", "Open", "Completed"] as const

const asDomainTask = (task: ContextTask): Task => ({
  id: task.id, title: task.title, description: task.description ?? null, status: task.status,
  priority: task.priority ?? "medium", due_at: task.due_at ?? null, estimated_minutes: task.estimated_minutes ?? null,
  required_energy: task.required_energy ?? null, category: task.category ?? null, source: task.source ?? "manual",
  top_priority_rank: task.top_priority_rank ?? null, recurrence: task.recurrence ?? null,
  recurrence_parent_id: task.recurrence_parent_id ?? null, occurrence_date: task.occurrence_date ?? null,
  project_id: task.project_id ?? null, goal_id: task.goal_id ?? null, created_at: task.created_at,
  updated_at: task.updated_at ?? task.created_at, completed_at: task.completed_at ?? null,
})

export function TodayView() {
  const { tasks, addTask, completeTask, reopenTask, setActiveTaskId, user } = useVibe()
  const [energy, setEnergy] = useState<RequiredEnergy>(() => typeof window === "undefined" ? "medium" : (localStorage.getItem("vibefocus_today_energy") as RequiredEnergy) || "medium")
  const [view, setView] = useState<typeof views[number]>("All")
  const [quickTitle, setQuickTitle] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [focusMinutes, setFocusMinutes] = useState(0)
  const domainTasks = useMemo(() => tasks.map(asDomainTask), [tasks])
  const groups = useMemo(() => groupTodayTasks(domainTasks), [domainTasks])
  const ranked = useMemo(() => rankTodayTasks(domainTasks, energy), [domainTasks, energy])
  const suggestion = ranked[0]
  const pending = tasks.filter((task) => task.status === "pending")
  const completed = tasks.filter((task) => task.status === "completed")
  const pendingAudits = completed.filter((task) => !task.energy).length
  const dueToday = groups.today.length
  const name = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email?.split("@")[0]
  const selectedTask = pending.find((task) => task.id === selectedTaskId) ?? suggestion?.task
  const displayed = tasks.filter((task) => view === "All" || (view === "Open" ? task.status === "pending" : task.status === "completed")).slice(0, 5)

  useEffect(() => {
    fetch("/api/analytics/summary", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((summary) => setFocusMinutes(Math.round((summary?.focus?.total_seconds ?? 0) / 60))).catch(() => undefined)
  }, [])

  const chooseEnergy = (value: RequiredEnergy) => {
    setEnergy(value)
    localStorage.setItem("vibefocus_today_energy", value)
    void saveEnergyCheckin(value)
  }
  const quickAdd = (event: React.FormEvent) => {
    event.preventDefault()
    if (!quickTitle.trim()) return
    addTask(quickTitle.trim())
    setQuickTitle("")
  }

  return <Page className="max-w-[96rem] space-y-6 md:space-y-7">
    <header className="space-y-2 py-2 sm:py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p>
      <h1 className="text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Good {greeting()}{name ? `, ${name}` : ""}</h1>
      <p className="text-sm text-muted-foreground sm:text-base">Let&apos;s make meaningful progress today.</p>
    </header>

    {pendingAudits > 0 && <Link href="/dashboard/audit" className="dashboard-panel dashboard-panel-hover flex items-center justify-between gap-4 rounded-2xl border-primary/20 bg-[var(--accent-soft)]/35 p-4"><div><p className="text-sm font-semibold">{pendingAudits} completed task{pendingAudits === 1 ? "" : "s"} waiting for reflection</p><p className="mt-1 text-xs text-muted-foreground">A quick energy check keeps your insights useful.</p></div><Button asChild size="sm" variant="secondary"><span>Reflect<ArrowUpRight /></span></Button></Link>}

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,.9fr)]">
      <div className="dashboard-panel overflow-hidden rounded-[1.75rem] border-[var(--border-default)]">
        <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><ListChecks className="size-5" /></div><div><h2 className="text-xl font-semibold tracking-[-.03em]">My tasks</h2><p className="text-xs text-muted-foreground">{pending.length} open today</p></div></div>
          <div className="flex w-fit gap-1 rounded-xl bg-[var(--surface-secondary)] p-1">{views.map((item) => <button key={item} onClick={() => setView(item)} className={cn("min-h-9 rounded-lg px-4 text-xs font-semibold transition-all", view === item ? "bg-[var(--surface-elevated)] text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item}</button>)}</div>
        </div>
        <div className="space-y-2 p-3 sm:p-5">
          {displayed.length ? displayed.map((task) => <TodayTaskRow key={task.id} task={task} onToggle={() => task.status === "completed" ? reopenTask(task.id) : completeTask(task.id)} onFocus={() => { setSelectedTaskId(task.id); setActiveTaskId(task.id) }} />) : <div className="flex min-h-52 flex-col items-center justify-center text-center"><CheckCircle2 className="size-9 text-[var(--success)]" /><p className="mt-3 font-semibold">Nothing in this view</p><p className="mt-1 text-sm text-muted-foreground">A little open space is useful too.</p></div>}
        </div>
        <form onSubmit={quickAdd} className="flex gap-2 border-t border-[var(--border-subtle)] p-3 sm:p-5"><label className="relative flex-1"><Plus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" /><Input aria-label="Add a new task" value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} className="border-transparent bg-[var(--surface-secondary)] pl-9" placeholder="Add a new task" maxLength={200} /></label><Button disabled={!quickTitle.trim()}>Add</Button></form>
      </div>

      <aside className="dashboard-panel accent-glow relative overflow-hidden rounded-[1.75rem] border-primary/30 p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex h-full min-h-[31rem] flex-col">
          <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><Clock3 className="size-5" /></div><div><h2 className="text-xl font-semibold tracking-[-.03em]">Focus session</h2><p className="text-xs text-muted-foreground">Protect one meaningful block</p></div></div>
          <div className="my-auto flex flex-col items-center py-7">
            <div className="relative flex size-56 items-center justify-center rounded-full bg-[conic-gradient(var(--accent-primary)_0_82%,var(--surface-secondary)_82%)] p-[10px] shadow-[var(--shadow-glow)] sm:size-64"><div className="flex size-full flex-col items-center justify-center rounded-full bg-[var(--background-subtle)]"><span className="timer-numerals text-5xl font-semibold tracking-[-.06em]">{String(selectedTask?.estimated_minutes ?? 25).padStart(2, "0")}:00</span><span className="mt-2 text-sm text-muted-foreground">Focus time</span></div></div>
            <div className="mt-6 w-full text-center"><p className="truncate font-semibold">{selectedTask?.title ?? "Choose a task to begin"}</p>{suggestion && selectedTask?.id === suggestion.task.id && <p className="mt-1 text-xs text-muted-foreground">Recommended because it is {suggestion.reason}.</p>}</div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2" aria-label="Current energy">{levels.map(({ value, label, icon: Icon }) => <button key={value} aria-pressed={energy === value} onClick={() => chooseEnergy(value)} className={cn("flex min-h-12 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold", energy === value ? "border-primary bg-[var(--accent-soft)] text-primary" : "border-[var(--border-subtle)] bg-[var(--surface-secondary)] text-muted-foreground")}><Icon className="size-4" /><span className="hidden sm:inline">{label}</span></button>)}</div>
            <Button size="lg" className="accent-glow w-full" disabled={!selectedTask} onClick={() => selectedTask && setActiveTaskId(selectedTask.id)}><Play className="fill-current" />Start focus</Button>
            <label className="relative block"><select aria-label="Select focus task" value={selectedTask?.id ?? ""} onChange={(event) => setSelectedTaskId(event.target.value)} className="h-12 w-full appearance-none rounded-xl border bg-[var(--surface-secondary)] px-4 pr-10 text-sm font-medium"><option value="">Select a task</option>{pending.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></label>
          </div>
        </div>
      </aside>
    </section>

    <section className="dashboard-panel grid grid-cols-2 divide-x divide-y divide-[var(--border-subtle)] overflow-hidden rounded-[1.5rem] border-[var(--border-default)] md:grid-cols-4 md:divide-y-0">
      <Metric icon={CheckCircle2} label="Completed" value={completed.length} color="text-[var(--success)]" />
      <Metric icon={Target} label="Open tasks" value={pending.length} color="text-primary" />
      <Metric icon={CalendarDays} label="Due today" value={dueToday} color="text-[var(--warning)]" />
      <Metric icon={Flame} label="Focus time" value={`${focusMinutes} min`} color="text-[var(--energy-low)]" />
    </section>
  </Page>
}

function TodayTaskRow({ task, onToggle, onFocus }: { task: ContextTask; onToggle: () => void; onFocus: () => void }) {
  const priority = priorityMeta[task.priority ?? "medium"]
  const due = formatDueDate(task.due_at)
  return <div className={cn("group flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)]/55 p-3 transition-all hover:border-[var(--border-default)] hover:bg-[var(--surface-hover)] sm:p-4", task.status === "completed" && "opacity-60")}>
    <button aria-label={task.status === "completed" ? "Reopen task" : "Complete task"} onClick={onToggle} className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border-2", task.status === "completed" ? "border-[var(--success)] bg-[var(--success)] text-[var(--text-inverse)]" : "border-primary")} >{task.status === "completed" && <Check className="size-4" />}</button>
    <div className="min-w-0 flex-1"><p className={cn("truncate font-semibold tracking-[-.015em]", task.status === "completed" && "line-through")}>{task.title}</p><div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className={cn("flex items-center gap-1", priority.className.split(" ").find((item) => item.startsWith("text-")))}><CircleDot className="size-3 fill-current" />{priority.label}</span>{task.category && <><span>·</span><span>{task.category}</span></>}{due && <><span>·</span><span className="flex items-center gap-1"><CalendarDays className="size-3" />{due}</span></>}</div></div>
    {task.status === "pending" && <Button size="icon" variant="outline" aria-label={`Focus on ${task.title}`} onClick={onFocus}><Play className="fill-current" /></Button>}
  </div>
}

function Metric({ icon: Icon, label, value, color }: { icon: typeof Sparkles; label: string; value: string | number; color: string }) {
  return <div className="flex min-h-28 items-center gap-4 p-4 sm:p-6"><div className={cn("flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)]", color)}><Icon className="size-6" /></div><div><p className="text-2xl font-semibold tracking-[-.04em]">{value}</p><p className="mt-0.5 text-xs text-muted-foreground">{label}</p></div></div>
}

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"
}
