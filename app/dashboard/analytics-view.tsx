"use client"

import { BarChart3, BatteryCharging, CheckCircle2, Clock3, Flame, Focus, ListChecks } from "lucide-react"
import { useVibe } from "@/context/VibeContext"
import { Page, PageHeader, SectionHeader } from "@/components/ui/page"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { FocusSummary } from "@/components/dashboard/FocusSummary"
import { EnergyChart } from "@/components/dashboard/EnergyChart"

export default function InsightsPage() {
  const { tasks, streak } = useVibe()
  const completed = tasks.filter((task) => task.status === "completed").length
  const pending = tasks.filter((task) => task.status === "pending").length
  const audited = tasks.filter((task) => task.energy).length
  const rate = tasks.length ? Math.round(completed / tasks.length * 100) : 0

  return <Page>
    <PageHeader eyebrow="Patterns, not pressure" title="Insights" description="A calm view of your progress, focus consistency, and energy patterns." />
    {!tasks.length ? <EmptyState icon={BarChart3} title="Your insights will grow with you" description="Complete and audit a few focus sessions to discover useful patterns." /> : <>
      <section className="space-y-4"><SectionHeader title="Overview" description="The clearest signals from your recent work." /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric icon={ListChecks} label="Total tasks" value={tasks.length} /><Metric icon={CheckCircle2} label="Completed" value={completed} /><Metric icon={Clock3} label="Still open" value={pending} /><Metric icon={BarChart3} label="Completion" value={`${rate}%`} highlight /></div></section>
      <section className="space-y-4"><SectionHeader title="Focus" description="How consistently you protect deep-work time." /><FocusSummary /></section>
      <section className="space-y-4"><SectionHeader title="Consistency" /><div className="grid gap-3 sm:grid-cols-2"><Metric icon={Flame} label="Current streak" value={`${streak} days`} /><Metric icon={Focus} label="Audited tasks" value={audited} /></div></section>
      <section className="space-y-4"><SectionHeader title="Energy" description="How your completed work tends to feel." /><EnergyChart /></section>
    </>}
  </Page>
}

function Metric({ icon: Icon, label, value, highlight = false }: { icon: typeof BatteryCharging; label: string; value: string | number; highlight?: boolean }) {
  return <Card className={highlight ? "border-primary/25 bg-[var(--accent-soft)]/45" : ""}><CardContent className="flex items-center gap-3 px-4"><div className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><Icon className="size-5" /></div><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="text-2xl font-semibold tracking-[-0.04em]">{value}</p></div></CardContent></Card>
}
