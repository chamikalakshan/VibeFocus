"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Goal, LoaderCircle, PauseCircle, Save } from "lucide-react"
import { useVibe } from "@/context/VibeContext"
import { Page, PageHeader, SectionHeader } from "@/components/ui/page"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TaskFeed } from "@/components/dashboard/TaskFeed"
import { EmptyState } from "@/components/ui/empty-state"
import { queueMutation } from "@/lib/offline/db"

type Entity = "projects" | "goals"
type Item = { id: string; name: string; description: string | null; status: string }

export function PortfolioDetail({ entity, id }: { entity: Entity; id: string }) {
  const { tasks, user } = useVibe()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [busy, setBusy] = useState(false)
  const singular = entity === "projects" ? "project" : "goal"
  const Icon = entity === "projects" ? BriefcaseBusiness : Goal
  const related = tasks.filter((task) => entity === "projects" ? task.project_id === id : task.goal_id === id)
  const completed = related.filter((task) => task.status === "completed").length

  useEffect(() => {
    fetch(`/api/portfolio/${entity}`, { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((body) => {
      const found = body?.data?.find((value: Item) => value.id === id) ?? null
      setItem(found); setName(found?.name ?? ""); setDescription(found?.description ?? ""); setLoading(false)
    }).catch(() => setLoading(false))
  }, [entity, id])

  const save = async () => {
    if (!item || !name.trim()) return
    setBusy(true)
    const values = { id, name: name.trim(), description: description.trim() }
    try {
      const response = await fetch(`/api/portfolio/${entity}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(values) })
      if (!response.ok) throw new Error("Unable to save")
      setItem((await response.json()).data)
    } catch {
      if (user) await queueMutation({ ownerId: user.id, entity: singular, operation: "update", payload: values })
      setItem((current) => current ? { ...current, ...values } : current)
    }
    setBusy(false)
  }

  const status = async (next: string) => {
    try {
      const response = await fetch(`/api/portfolio/${entity}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: next }) })
      if (!response.ok) throw new Error("Unable to update")
      setItem((await response.json()).data)
    } catch {
      if (user) await queueMutation({ ownerId: user.id, entity: singular, operation: "update", payload: { id, status: next } })
      setItem((current) => current ? { ...current, status: next } : current)
    }
  }

  if (loading) return <Page><div className="flex min-h-[60vh] items-center justify-center"><LoaderCircle className="size-7 animate-spin text-primary" /></div></Page>
  if (!item) return <Page><EmptyState icon={Icon} title={`${capitalize(singular)} not available`} description={`This ${singular} may have been archived or the required migration is not available.`} action={<Button asChild variant="outline"><Link href={`/dashboard/${entity}`}>Back to {entity}</Link></Button>} /></Page>

  return <Page><Link href={`/dashboard/${entity}`} className="flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to {entity}</Link>
    <PageHeader eyebrow={singular} title={item.name} description={item.description || `Keep the outcome visible and review the work connected to this ${singular}.`} actions={<><Button variant="outline" onClick={() => status("paused")}><PauseCircle />Pause</Button><Button onClick={() => status(entity === "goals" ? "achieved" : "completed")}><CheckCircle2 />{entity === "goals" ? "Mark achieved" : "Complete"}</Button></>} />
    <section className="grid gap-4 lg:grid-cols-[.75fr_1.25fr]"><Card><CardContent className="space-y-4 p-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">Progress</p><p className="mt-2 text-4xl font-semibold tracking-[-.05em]">{related.length ? Math.round(completed / related.length * 100) : 0}%</p></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${related.length ? completed / related.length * 100 : 0}%` }} /></div><div className="grid grid-cols-2 gap-2"><Metric label="Related tasks" value={related.length} /><Metric label="Completed" value={completed} /></div><p className="text-xs capitalize text-muted-foreground">Current status: {item.status}</p></CardContent></Card>
      <Card><CardContent className="space-y-4 p-5"><SectionHeader title={`Edit ${singular}`} description="Keep the outcome clear enough to guide decisions." /><label className="block space-y-2 text-sm font-medium">Name<Input value={name} onChange={(event) => setName(event.target.value)} maxLength={160} /></label><label className="block space-y-2 text-sm font-medium">Description<Textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} /></label><Button disabled={busy || !name.trim()} onClick={save}><Save />{busy ? "Saving..." : "Save changes"}</Button></CardContent></Card></section>
    <section className="space-y-4"><SectionHeader title="Related tasks" description={`Tasks currently connected to this ${singular}.`} />{related.length ? <TaskFeed taskIds={related.map((task) => task.id)} showHeader={false} showViewAll={false} /> : <EmptyState icon={Icon} title="No related tasks yet" description={`Task assignment will appear here once tasks are connected to this ${singular}.`} />}</section>
  </Page>
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-[var(--surface-secondary)] p-3"><p className="text-xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div> }
function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1) }
