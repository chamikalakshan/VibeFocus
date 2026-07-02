import type { RequiredEnergy, Task } from "./types"

const priorityWeight = { low: 10, medium: 30, high: 60 }
const energyWeight: Record<RequiredEnergy, number> = { low: 1, medium: 2, high: 3 }

export function isLegacyTaskSchemaError(error: { code?: string | null; message?: string | null } | null): boolean {
  if (!error) return false
  return error.code === "PGRST204"
    || error.code === "42703"
    || Boolean(error.message?.includes("schema cache") && error.message.includes("tasks"))
}

export function rankTodayTasks(tasks: Task[], currentEnergy: RequiredEnergy, now = new Date()) {
  return tasks.filter((task) => task.status === "pending").map((task) => {
    let score = priorityWeight[task.priority]
    const reasons = [`${task.priority} priority`]
    if (task.due_at) {
      const hours = (new Date(task.due_at).getTime() - now.getTime()) / 3_600_000
      if (hours < 0) { score += 100; reasons.push("overdue") }
      else if (hours <= 24) { score += 70; reasons.push("due within 24 hours") }
      else if (hours <= 72) { score += 30; reasons.push("due soon") }
    }
    if (task.required_energy) {
      const gap = Math.abs(energyWeight[task.required_energy] - energyWeight[currentEnergy])
      score += (2 - gap) * 15
      if (gap === 0) reasons.push("matches your current energy")
    }
    if (task.top_priority_rank) { score += 80 - task.top_priority_rank; reasons.push("top priority") }
    return { task, score, reason: reasons.join(", ") }
  }).sort((a, b) => b.score - a.score)
}
