export type TaskStatus = "pending" | "completed" | "archived"
export type Priority = "low" | "medium" | "high"
export type RequiredEnergy = "low" | "medium" | "high"
export type EnergyRating = "energizing" | "neutral" | "draining"
export type TaskSource = "manual" | "bulk_import" | "ai_import"
export type Recurrence = "daily" | "weekdays" | "weekly" | "monthly"
export type ProjectStatus = "active" | "paused" | "completed" | "archived"
export type GoalStatus = "active" | "achieved" | "paused" | "archived"
export type SyncState = "synced" | "pending" | "failed"

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  due_at: string | null
  estimated_minutes: number | null
  required_energy: RequiredEnergy | null
  category: string | null
  source: TaskSource
  top_priority_rank: number | null
  recurrence: Recurrence | null
  recurrence_parent_id: string | null
  occurrence_date: string | null
  project_id: string | null
  goal_id: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  color: string | null
  goal_id: string | null
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  name: string
  description: string | null
  status: GoalStatus
  target_date: string | null
  created_at: string
  updated_at: string
}
