"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BatteryCharging, CalendarDays, CheckCircle2, CircleDot, Filter, Focus, ListFilter, Play, Plus, Search } from "lucide-react"
import { useVibe } from "@/context/VibeContext"
import { Page } from "@/components/ui/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TaskFeed } from "@/components/dashboard/TaskFeed"
import { AdvancedTaskForm } from "@/components/planning/AdvancedTaskForm"
import { ImportPanel } from "@/components/planning/ImportPanel"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const views = ["Inbox", "Today", "Upcoming", "Completed", "All"] as const

export function TaskWorkspace() {
  const { tasks, addTask, setActiveTaskId } = useVibe()
  const [view, setView] = useState<typeof views[number]>("Inbox")
  const [query, setQuery] = useState("")
  const [quickTitle, setQuickTitle] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const [priority, setPriority] = useState("all")
  const [energy, setEnergy] = useState("all")
  const [category, setCategory] = useState("all")
  const [due, setDue] = useState("all")
  const [project, setProject] = useState("all")
  const [goal, setGoal] = useState("all")
  const [focusTaskId, setFocusTaskId] = useState("")
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [goals, setGoals] = useState<Array<{ id: string; name: string }>>([])
  const categories = useMemo(() => [...new Set(tasks.map((task) => task.category).filter(Boolean) as string[])].sort(), [tasks])
  const activeFilters = [priority, energy, category, due, project, goal].filter((value) => value !== "all").length

  useEffect(() => {
    fetch("/api/schema/capabilities", { cache: "no-store" }).then((response) => response.json()).then(async (capabilities) => {
      if (capabilities.projects) {
        const response = await fetch("/api/portfolio/projects", { cache: "no-store" })
        if (response.ok) setProjects((await response.json()).data)
      }
      if (capabilities.goals) {
        const response = await fetch("/api/portfolio/goals", { cache: "no-store" })
        if (response.ok) setGoals((await response.json()).data)
      }
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    const openEditorFromHash = () => {
      if (window.location.hash !== "#add-task") return
      setEditorOpen(true)
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`)
    }
    openEditorFromHash()
    window.addEventListener("hashchange", openEditorFromHash)
    return () => window.removeEventListener("hashchange", openEditorFromHash)
  }, [])

  const ids = useMemo(() => tasks.filter((task) => {
    if (!task.title.toLowerCase().includes(query.toLowerCase())) return false
    if (priority !== "all" && task.priority !== priority) return false
    if (energy !== "all" && task.required_energy !== energy) return false
    if (category !== "all" && task.category !== category) return false
    if (project !== "all" && (project === "none" ? task.project_id : task.project_id !== project)) return false
    if (goal !== "all" && (goal === "none" ? task.goal_id : task.goal_id !== goal)) return false
    if (due !== "all") {
      if (due === "none" && task.due_at) return false
      if (due !== "none" && !task.due_at) return false
      if (task.due_at) {
        const taskDate = new Date(task.due_at)
        const now = new Date()
        if (due === "overdue" && taskDate >= now) return false
        if (due === "today" && taskDate.toDateString() !== now.toDateString()) return false
        if (due === "upcoming" && (taskDate <= now || taskDate.toDateString() === now.toDateString())) return false
      }
    }
    if (view === "Completed") return task.status === "completed"
    if (view === "All") return true
    if (task.status !== "pending") return false
    if (view === "Today") return task.due_at ? new Date(task.due_at).toDateString() === new Date().toDateString() : false
    if (view === "Upcoming") return task.due_at ? new Date(task.due_at) > new Date() : false
    return !task.due_at
  }).map((task) => task.id), [category, due, energy, goal, priority, project, query, tasks, view])

  const pending = tasks.filter((task) => task.status === "pending")
  const completed = tasks.filter((task) => task.status === "completed")
  const today = pending.filter((task) => task.due_at && new Date(task.due_at).toDateString() === new Date().toDateString()).length
  const audits = completed.filter((task) => !task.energy).length
  const selectedFocusTask = pending.find((task) => task.id === focusTaskId) ?? pending[0]
  const quickAdd = (event: React.FormEvent) => {
    event.preventDefault()
    const title = quickTitle.trim()
    if (!title) return
    addTask(title)
    setQuickTitle("")
  }

  return <Page className="max-w-[80rem] space-y-5 md:space-y-6">
    <header className="flex items-end justify-between gap-4 py-1">
      <div><h1 className="text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Tasks</h1><p className="mt-1 text-sm text-muted-foreground">Plan, focus, and complete your work in one place.</p></div>
      <Button className="shrink-0" onClick={() => setEditorOpen(true)}><Plus />Add task</Button>
    </header>

    <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <TaskMetric icon={CircleDot} label="Open" value={pending.length} />
      <TaskMetric icon={CalendarDays} label="Today" value={today} />
      <TaskMetric icon={CheckCircle2} label="Completed" value={completed.length} />
      <TaskMetric icon={BatteryCharging} label="Audits" value={audits} highlight={audits > 0} />
    </section>

    <form id="add-task" onSubmit={quickAdd} className="dashboard-panel accent-glow flex gap-2 rounded-[1.15rem] border-primary/15 p-2.5"><label className="relative flex-1"><Plus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" /><Input aria-label="Quick task title" value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} className="h-10 border-transparent bg-[var(--surface-secondary)] pl-9" placeholder="Add a task..." maxLength={200} /></label><Button className="h-10" disabled={!quickTitle.trim()}>Add</Button></form>

    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <main className="order-2 min-w-0 space-y-3 lg:order-1">
        <div className="dashboard-panel space-y-3 rounded-[1.2rem] p-2.5 sm:p-3">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-[var(--surface-secondary)] p-1">{views.map((item) => <button key={item} className={cn("min-h-8 shrink-0 rounded-lg px-3 text-xs font-semibold transition-all", view === item ? "bg-[var(--surface-elevated)] text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")} onClick={() => setView(item)}>{item}</button>)}</div>
          <div className="flex flex-col gap-2 sm:flex-row"><label className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-10 pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" /></label><Filters activeFilters={activeFilters} priority={priority} setPriority={setPriority} energy={energy} setEnergy={setEnergy} due={due} setDue={setDue} category={category} setCategory={setCategory} categories={categories} project={project} setProject={setProject} projects={projects} goal={goal} setGoal={setGoal} goals={goals} /></div>
        </div>
        <TaskFeed taskIds={ids} showHeader={false} showViewAll={false} taskPage />
      </main>

      <aside className="order-1 grid gap-3 sm:grid-cols-2 lg:order-2 lg:sticky lg:top-20 lg:grid-cols-1">
        <section className="dashboard-panel accent-glow overflow-hidden rounded-[1.2rem] border-primary/20 p-4">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><BatteryCharging className="size-5" /></div><div><h2 className="font-semibold">Energy Audit</h2><p className="text-xs text-muted-foreground">Close the loop</p></div></div>
          <p className="mt-5 text-3xl font-semibold tracking-[-.05em]">{audits}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">completed task{audits === 1 ? "" : "s"} waiting for reflection</p>
          {audits > 0 ? <Button asChild className="mt-4 w-full"><Link href="/dashboard/audit">Start audit</Link></Button> : <Button className="mt-4 w-full" disabled>Start audit</Button>}
        </section>
        <section className="dashboard-panel rounded-[1.2rem] p-4">
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><Focus className="size-5" /></div><div><h2 className="font-semibold">Focus shortcut</h2><p className="text-xs text-muted-foreground">Start with one task</p></div></div>
          <label className="mt-4 block"><span className="sr-only">Select focus task</span><select value={selectedFocusTask?.id ?? ""} onChange={(event) => setFocusTaskId(event.target.value)} className="h-10 w-full rounded-xl border bg-[var(--surface-secondary)] px-3 text-sm"><option value="">Select a task</option>{pending.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
          <Button className="mt-3 w-full" variant="secondary" disabled={!selectedFocusTask} onClick={() => selectedFocusTask && setActiveTaskId(selectedFocusTask.id)}><Play className="fill-current" />Start focus</Button>
        </section>
      </aside>
    </div>

    <Sheet open={editorOpen} onOpenChange={setEditorOpen}><SheetContent side="right" className="w-full overflow-y-auto bg-[var(--background)] sm:max-w-2xl"><SheetHeader><SheetTitle>Add a task</SheetTitle></SheetHeader><div className="space-y-3 px-4 pb-8"><AdvancedTaskForm /><ImportPanel /></div></SheetContent></Sheet>
  </Page>
}

function TaskMetric({ icon: Icon, label, value, highlight = false }: { icon: typeof CircleDot; label: string; value: number; highlight?: boolean }) {
  return <div className={cn("dashboard-panel flex min-h-16 items-center gap-3 rounded-xl p-3", highlight && "border-primary/25 bg-[var(--accent-soft)]/35")}><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-primary"><Icon className="size-4.5" /></div><div><p className="text-xl font-semibold tracking-[-.04em]">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div></div>
}

function Filters(props: { activeFilters: number; priority: string; setPriority: (value: string) => void; energy: string; setEnergy: (value: string) => void; due: string; setDue: (value: string) => void; category: string; setCategory: (value: string) => void; categories: string[]; project: string; setProject: (value: string) => void; projects: Array<{ id: string; name: string }>; goal: string; setGoal: (value: string) => void; goals: Array<{ id: string; name: string }> }) {
  const { activeFilters, priority, setPriority, energy, setEnergy, due, setDue, category, setCategory, categories, project, setProject, projects, goal, setGoal, goals } = props
  return <Sheet><SheetTrigger asChild><Button className="h-10 shrink-0" variant={activeFilters ? "secondary" : "outline"} aria-label="Filters"><Filter />Filters{activeFilters > 0 && <Badge className="ml-1 min-w-5 px-1.5">{activeFilters}</Badge>}</Button></SheetTrigger><SheetContent side="right"><SheetHeader><SheetTitle className="flex items-center gap-2"><ListFilter className="size-4" />Filter tasks</SheetTitle></SheetHeader><div className="space-y-5 px-4"><FilterSelect label="Priority" value={priority} onChange={setPriority} options={["all", "high", "medium", "low"]} /><FilterSelect label="Required energy" value={energy} onChange={setEnergy} options={["all", "high", "medium", "low"]} /><FilterSelect label="Due date" value={due} onChange={setDue} options={["all", "overdue", "today", "upcoming", "none"]} /><FilterSelect label="Category" value={category} onChange={setCategory} options={["all", ...categories]} />{projects.length > 0 && <RelationFilter label="Project" value={project} onChange={setProject} options={projects} />}{goals.length > 0 && <RelationFilter label="Goal" value={goal} onChange={setGoal} options={goals} />}<Button variant="outline" className="w-full" disabled={!activeFilters} onClick={() => { setPriority("all"); setEnergy("all"); setCategory("all"); setDue("all"); setProject("all"); setGoal("all") }}>Clear filters</Button></div></SheetContent></Sheet>
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="block space-y-2 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="block h-11 w-full rounded-xl border bg-[var(--surface-secondary)] px-3 capitalize">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
}

function RelationFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ id: string; name: string }> }) {
  return <label className="block space-y-2 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="block h-11 w-full rounded-xl border bg-[var(--surface-secondary)] px-3"><option value="all">All</option><option value="none">No {label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
}
