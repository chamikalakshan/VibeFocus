"use client"

import { ArrowUpRight, Clock3, Focus, Play, Sparkles } from "lucide-react"
import { useVibe } from "@/context/VibeContext"
import { Page, PageHeader, SectionHeader } from "@/components/ui/page"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

export default function FocusLauncherPage() {
  const { tasks, setActiveTaskId } = useVibe()
  const pending = tasks.filter((task) => task.status === "pending").slice(0, 6)
  const recommended = pending[0]
  return <Page><PageHeader eyebrow="Protect your attention" title="Start a focus session" description="Choose one task. The rest can wait." />
    {recommended && <Card className="accent-glow subtle-grid overflow-hidden border-primary/25 bg-gradient-to-br from-[var(--surface-primary)] to-[var(--accent-soft)]"><CardContent className="flex min-h-64 flex-col justify-between gap-8 p-6 sm:p-8"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-primary"><Sparkles className="size-4" />Strong starting point</div><div><h2 className="max-w-3xl text-3xl font-semibold tracking-[-.05em] sm:text-5xl">{recommended.title}</h2><p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" />Begin with {recommended.estimated_minutes ?? 25} focused minutes. You can adjust the timer before starting.</p></div><Button size="lg" className="w-fit accent-glow" onClick={() => setActiveTaskId(recommended.id)}><Play className="fill-current" />Enter focus mode<ArrowUpRight /></Button></CardContent></Card>}
    {pending.length ? <section className="space-y-4"><SectionHeader title="More tasks" description="Other pending work ready for a focused session." /><div className="grid gap-3 md:grid-cols-2">{pending.slice(1).map((task) => <Card key={task.id} className="dashboard-panel-hover"><CardContent className="flex items-center gap-4 p-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><Focus className="size-5" /></div><div className="min-w-0 flex-1"><p className="truncate font-semibold tracking-[-.02em]">{task.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />{task.estimated_minutes ?? 25} minute starting point</p></div><Button size="icon" aria-label={`Focus on ${task.title}`} onClick={() => setActiveTaskId(task.id)}><Play className="fill-current" /></Button></CardContent></Card>)}</div></section> : <EmptyState icon={Focus} title="Choose a task before focusing" description="Add a task first, then return here for a calm, distraction-free session." />}
  </Page>
}
