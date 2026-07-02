"use client"

import { useState } from "react"
import { BatteryCharging, CalendarClock, CheckCircle2, Clock3, Goal, MoreVertical, Pencil, Play, RefreshCw, RotateCcw, Tag, Trash2, Workflow } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useVibe, type Task } from "@/context/VibeContext"
import { priorityMeta, energyMeta, formatDueDate, formatDuration } from "@/lib/domain/presentation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { EditTaskDialog } from "@/components/planning/EditTaskDialog"

export function TaskFeed({ hideCompleted = false, hideOlderThanHours, showViewAll = true, showHeader = true, taskIds, compact = false, taskPage = false }: { hideCompleted?: boolean; hideOlderThanHours?: number; showViewAll?: boolean; showHeader?: boolean; taskIds?: string[]; compact?: boolean; taskPage?: boolean }) {
  const { tasks, completeTask, reopenTask, setActiveTaskId, deleteTask } = useVibe()
  const router = useRouter()
  const [cutoff] = useState(() => hideOlderThanHours ? Date.now() - hideOlderThanHours * 3_600_000 : null)
  const sorted = tasks.filter((task) => (!taskIds || taskIds.includes(task.id)) && (!hideCompleted || task.status !== "completed") && (!cutoff || new Date(task.created_at).getTime() >= cutoff)).sort((a, b) => a.status === b.status ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : a.status === "pending" ? -1 : 1)
  return <div className={cn("space-y-3", taskPage && "space-y-2")}>
    {showHeader && <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Your tasks</h2>{showViewAll && <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/tasks")}>View all</Button>}</div>}
    {sorted.length ? sorted.map((task) => <TaskCard key={task.id} task={task} compact={compact} taskPage={taskPage} onComplete={() => completeTask(task.id)} onReopen={() => reopenTask(task.id)} onFocus={() => setActiveTaskId(task.id)} onDelete={() => deleteTask(task.id)} />) : <EmptyState icon={CheckCircle2} title="Nothing here right now" description="A little space in the day is a feature, not a bug." className="py-8" />}
  </div>
}

function TaskCard({ task, compact, taskPage, onComplete, onReopen, onFocus, onDelete }: { task: Task; compact: boolean; taskPage: boolean; onComplete: () => void; onReopen: () => void; onFocus: () => void; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const due = formatDueDate(task.due_at)
  const priority = priorityMeta[task.priority ?? "medium"]
  const requiredEnergy = task.required_energy ? energyMeta[task.required_energy] : null
  return <div className={cn("dashboard-panel dashboard-panel-hover group relative flex items-start gap-3 overflow-hidden rounded-[1.15rem] p-3 sm:p-4", taskPage && "min-h-[4.75rem] items-center rounded-xl py-2.5 sm:px-3 sm:py-2.5", task.status === "completed" && "opacity-65")}>
    <span aria-hidden className={cn("absolute inset-y-2 left-0 w-0.5 rounded-full", task.status === "completed" ? "bg-[var(--success)]" : task.priority === "high" ? "bg-[var(--priority-high)]" : task.priority === "low" ? "bg-[var(--priority-low)]" : "bg-primary")} />
    <button aria-label={task.status === "completed" ? "Reopen task" : "Complete task"} onClick={task.status === "completed" ? onReopen : onComplete} className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all", taskPage && "mt-0", task.status === "completed" ? "border-[var(--success)] bg-[var(--success)] text-[var(--text-inverse)]" : "border-[var(--border-strong)] bg-[var(--surface-secondary)] hover:scale-105 hover:border-primary")} >{task.status === "completed" && <CheckCircle2 className="size-4" />}</button>
    <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className={cn("truncate font-semibold tracking-[-0.015em]", task.status === "completed" && "line-through")}>{task.title}</h3>{task.top_priority_rank && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Top {task.top_priority_rank}</span>}</div>{!compact && !taskPage && task.description && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{task.description}</p>}<div className={cn("mt-2 flex flex-wrap gap-1.5", (compact || taskPage) && "mt-1 gap-1")} >{(!compact || taskPage) && <Badge variant="secondary" className={priority.className}>{priority.label}</Badge>}{!taskPage && requiredEnergy && <Badge variant="secondary" className={requiredEnergy.className}>{requiredEnergy.label} energy</Badge>}{due && <Badge variant="outline"><CalendarClock />{due}</Badge>}{formatDuration(task.estimated_minutes) && <Badge variant="outline"><Clock3 />{formatDuration(task.estimated_minutes)}</Badge>}{!compact && !taskPage && task.category && <Badge variant="outline"><Tag />{task.category}</Badge>}{!compact && !taskPage && task.project_id && <Badge variant="outline"><Workflow />Project</Badge>}{!compact && !taskPage && task.goal_id && <Badge variant="outline"><Goal />Goal</Badge>}{!compact && !taskPage && task.recurrence && <Badge variant="outline"><RefreshCw />{task.recurrence}</Badge>}{task.sync_state === "pending" && <Badge variant="outline">Pending sync</Badge>}</div></div>
    {task.status === "pending" && <Button size="sm" variant="secondary" className="border border-transparent group-hover:border-primary/20 group-hover:text-primary" onClick={onFocus}><Play className="fill-current" /><span className="hidden sm:inline">Focus</span></Button>}
    {taskPage && task.status === "completed" && !task.energy && <Button asChild size="sm" variant="secondary"><Link href="/dashboard/audit"><BatteryCharging /><span className="hidden sm:inline">Audit</span></Link></Button>}
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Task actions"><MoreVertical /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{task.status === "completed" && <DropdownMenuItem onClick={onReopen}><RotateCcw />Reopen</DropdownMenuItem>}<DropdownMenuItem onClick={() => setEditing(true)}><Pencil />Edit task</DropdownMenuItem><DropdownMenuItem className="text-[var(--danger)]" onClick={() => setConfirming(true)}><Trash2 />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    <EditTaskDialog task={task} open={editing} onOpenChange={setEditing} />
    <Dialog open={confirming} onOpenChange={setConfirming}><DialogContent><DialogHeader><DialogTitle>Delete this task?</DialogTitle><DialogDescription>This removes “{task.title}” and its associated history.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirming(false)}>Cancel</Button><Button variant="destructive" onClick={() => { onDelete(); setConfirming(false) }}>Delete task</Button></DialogFooter></DialogContent></Dialog>
  </div>
}
