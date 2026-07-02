"use client"

import { useEffect, useState } from "react"
import { createPlannedTask } from "@/actions/task"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CalendarPlus, ChevronDown } from "lucide-react"

export function AdvancedTaskForm() {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [goals, setGoals] = useState<Array<{ id: string; name: string }>>([])

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

  return <details className="dashboard-panel group rounded-[1.4rem] p-4 sm:p-5">
    <summary className="flex cursor-pointer list-none items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><CalendarPlus className="size-5" /></div><div className="flex-1"><p className="font-semibold tracking-[-.02em]">Plan a task with details</p><p className="mt-0.5 text-xs text-muted-foreground">Add context, timing, energy, and recurrence.</p></div><ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" /></summary>
    <form action={createPlannedTask} className="mt-5 grid gap-4 border-t border-[var(--border-subtle)] pt-5 md:grid-cols-2">
      <label className="space-y-1 text-sm md:col-span-2">Title<Input required name="title" maxLength={200} /></label>
      <label className="space-y-1 text-sm md:col-span-2">Notes<Textarea name="description" maxLength={2000} /></label>
      <FieldSelect name="priority" label="Priority" options={["low", "medium", "high"]} defaultValue="medium" />
      <label className="space-y-1 text-sm">Due date and time<Input type="datetime-local" name="due_at" /></label>
      <label className="space-y-1 text-sm">Estimated minutes<Input type="number" name="estimated_minutes" min="1" max="1440" /></label>
      <FieldSelect name="required_energy" label="Required energy" options={["", "low", "medium", "high"]} />
      <label className="space-y-1 text-sm">Category<Input name="category" maxLength={80} /></label>
      <FieldSelect name="recurrence" label="Repeat" options={["", "daily", "weekdays", "weekly", "monthly"]} />
      {projects.length > 0 && <RelationSelect name="project_id" label="Project" options={projects} />}
      {goals.length > 0 && <RelationSelect name="goal_id" label="Goal" options={goals} />}
      <Button type="submit" size="lg" className="md:col-span-2">Create planned task</Button>
    </form>
  </details>
}

function RelationSelect({ name, label, options }: { name: string; label: string; options: Array<{ id: string; name: string }> }) {
  return <label className="space-y-1 text-sm">{label}<select name={name} defaultValue="" className="block h-11 w-full rounded-xl border bg-[var(--surface-secondary)] px-3"><option value="">None</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
}

function FieldSelect({ name, label, options, defaultValue }: { name: string; label: string; options: string[]; defaultValue?: string }) {
  return <label className="space-y-1 text-sm">{label}<select name={name} defaultValue={defaultValue} className="block h-11 w-full rounded-xl border bg-[var(--surface-secondary)] px-3">{options.map((option) => <option key={option} value={option}>{option || "None"}</option>)}</select></label>
}
