import { BatteryLow, BatteryMedium, BatteryFull, Flag, CircleAlert, Circle } from "lucide-react"
import type { Priority, RequiredEnergy, Task } from "./types"

export const priorityMeta: Record<Priority, { label: string; className: string; icon: typeof Flag }> = {
  low: { label: "Low", className: "bg-[var(--info-soft)] text-[var(--priority-low)]", icon: Circle },
  medium: { label: "Medium", className: "bg-[var(--warning-soft)] text-[var(--priority-medium)]", icon: Flag },
  high: { label: "High", className: "bg-[var(--danger-soft)] text-[var(--priority-high)]", icon: CircleAlert },
}

export const energyMeta: Record<RequiredEnergy, { label: string; description: string; className: string; icon: typeof BatteryLow }> = {
  low: { label: "Low", description: "Good for lighter, lower-effort work", className: "bg-[var(--energy-low-soft)] text-[var(--energy-low)]", icon: BatteryLow },
  medium: { label: "Balanced", description: "Good for steady, moderate-focus work", className: "bg-[var(--energy-balanced-soft)] text-[var(--energy-balanced)]", icon: BatteryMedium },
  high: { label: "High", description: "Best for demanding, deep-focus work", className: "bg-[var(--energy-high-soft)] text-[var(--energy-high)]", icon: BatteryFull },
}

export function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return null
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

export function formatDueDate(value: string | null | undefined, now = new Date()) {
  if (!value) return null
  const date = new Date(value)
  const diff = date.getTime() - now.getTime()
  if (diff < 0) return `Overdue · ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`
  if (date.toDateString() === now.toDateString()) return `Today · ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

export function groupTodayTasks(tasks: Task[], now = new Date()) {
  const pending = tasks.filter((task) => task.status === "pending")
  return {
    overdue: pending.filter((task) => task.due_at && new Date(task.due_at) < now),
    today: pending.filter((task) => task.due_at && new Date(task.due_at).toDateString() === now.toDateString()),
    unscheduled: pending.filter((task) => !task.due_at),
    completed: tasks.filter((task) => task.status === "completed" && new Date(task.completed_at ?? task.created_at).toDateString() === now.toDateString()),
  }
}
