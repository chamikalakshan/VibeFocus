"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useVibe, type Task, type TaskUpdate } from "@/context/VibeContext"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Relation = { id: string; name: string }

export function EditTaskDialog({ task, open, onOpenChange }: { task: Task; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { updateTask } = useVibe()
  const [projects, setProjects] = useState<Relation[]>([])
  const [goals, setGoals] = useState<Relation[]>([])
  const [canonical, setCanonical] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!open) return
    fetch("/api/schema/capabilities", { cache: "no-store" }).then((response) => response.json()).then(async (capabilities) => {
      setCanonical(Boolean(capabilities.canonicalTasks))
      const [projectResponse, goalResponse] = await Promise.all([
        capabilities.projects ? fetch("/api/portfolio/projects", { cache: "no-store" }) : null,
        capabilities.goals ? fetch("/api/portfolio/goals", { cache: "no-store" }) : null,
      ])
      if (projectResponse?.ok) setProjects((await projectResponse.json()).data)
      if (goalResponse?.ok) setGoals((await goalResponse.json()).data)
    }).catch(() => setCanonical(false))
  }, [open])

  async function save(formData: FormData) {
    setSaving(true)
    setMessage("")
    const due = String(formData.get("due_at") || "")
    const estimate = String(formData.get("estimated_minutes") || "")
    const values: TaskUpdate = {
      title: String(formData.get("title") || "").trim(),
      ...(canonical ? {
        description: String(formData.get("description") || "").trim() || null,
        priority: formData.get("priority") as Task["priority"],
        due_at: due ? new Date(due).toISOString() : null,
        estimated_minutes: estimate ? Number(estimate) : null,
        required_energy: (formData.get("required_energy") || null) as Task["required_energy"],
        category: String(formData.get("category") || "").trim() || null,
        recurrence: (formData.get("recurrence") || null) as Task["recurrence"],
        project_id: String(formData.get("project_id") || "") || null,
        goal_id: String(formData.get("goal_id") || "") || null,
      } : {}),
    }
    const saved = await updateTask(task.id, values)
    setSaving(false)
    if (saved) onOpenChange(false)
    else setMessage("Unable to save this task. Please try again.")
  }

  const localDue = task.due_at ? new Date(new Date(task.due_at).getTime() - new Date(task.due_at).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : ""
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>Edit task</DialogTitle><DialogDescription>Update the plan while preserving completion and focus history.</DialogDescription></DialogHeader>
      <form action={save} className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm md:col-span-2">Title<Input required name="title" defaultValue={task.title} maxLength={200} /></label>
        {canonical ? <>
          <label className="space-y-1 text-sm md:col-span-2">Notes<Textarea name="description" defaultValue={task.description ?? ""} maxLength={2000} /></label>
          <Select name="priority" label="Priority" defaultValue={task.priority ?? "medium"} options={["low", "medium", "high"]} />
          <label className="space-y-1 text-sm">Due date and time<Input type="datetime-local" name="due_at" defaultValue={localDue} /></label>
          <label className="space-y-1 text-sm">Estimated minutes<Input type="number" name="estimated_minutes" min="1" max="1440" defaultValue={task.estimated_minutes ?? ""} /></label>
          <Select name="required_energy" label="Required energy" defaultValue={task.required_energy ?? ""} options={["", "low", "medium", "high"]} />
          <label className="space-y-1 text-sm">Category<Input name="category" defaultValue={task.category ?? ""} maxLength={80} /></label>
          <Select name="recurrence" label="Repeat" defaultValue={task.recurrence ?? ""} options={["", "daily", "weekdays", "weekly", "monthly"]} />
          {projects.length > 0 && <RelationSelect name="project_id" label="Project" defaultValue={task.project_id ?? ""} options={projects} />}
          {goals.length > 0 && <RelationSelect name="goal_id" label="Goal" defaultValue={task.goal_id ?? ""} options={goals} />}
        </> : <p className="rounded-xl bg-[var(--surface-secondary)] p-3 text-sm text-muted-foreground md:col-span-2">Apply the canonical Supabase migration to edit planning metadata. Title editing remains available.</p>}
        {message && <p role="alert" className="text-sm text-[var(--danger)] md:col-span-2">{message}</p>}
        <DialogFooter className="md:col-span-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={saving}>{saving && <Loader2 className="animate-spin" />}Save changes</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}

function Select({ name, label, defaultValue, options }: { name: string; label: string; defaultValue: string; options: string[] }) {
  return <label className="space-y-1 text-sm">{label}<select name={name} defaultValue={defaultValue} className="block h-11 w-full rounded-xl border bg-[var(--surface-secondary)] px-3">{options.map((option) => <option key={option} value={option}>{option || "None"}</option>)}</select></label>
}

function RelationSelect({ name, label, defaultValue, options }: { name: string; label: string; defaultValue: string; options: Relation[] }) {
  return <label className="space-y-1 text-sm">{label}<select name={name} defaultValue={defaultValue} className="block h-11 w-full rounded-xl border bg-[var(--surface-secondary)] px-3"><option value="">None</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
}
