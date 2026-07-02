"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Archive, ArrowUpRight, BriefcaseBusiness, CircleDot, Goal as GoalIcon, LoaderCircle, Plus, Settings2 } from "lucide-react"
import { Page, PageHeader } from "@/components/ui/page"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import { useVibe } from "@/context/VibeContext"
import { queueMutation } from "@/lib/offline/db"

type Entity = "projects" | "goals"
type Item = { id: string; name: string; description: string | null; status: string; updated_at: string; sync_state?: "pending" }

export function PortfolioView({ entity }: { entity: Entity }) {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const { user } = useVibe()
  const singular = entity === "projects" ? "project" : "goal"
  const Icon = entity === "projects" ? BriefcaseBusiness : GoalIcon

  const load = useCallback(async () => {
    const response = await fetch(`/api/portfolio/${entity}`, { cache: "no-store" })
    if (response.ok) setItems((await response.json()).data)
  }, [entity])
  useEffect(() => {
    fetch("/api/schema/capabilities", { cache: "no-store" }).then((response) => response.json()).then((value) => {
      const available = Boolean(value[entity])
      setEnabled(available)
      if (available) void load()
    }).catch(() => setEnabled(false))
  }, [entity, load])

  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    const id = crypto.randomUUID()
    try {
      const response = await fetch(`/api/portfolio/${entity}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, name }) })
      if (!response.ok) throw new Error("Unable to create")
      setName(""); await load()
    } catch {
      if (user) await queueMutation({ ownerId: user.id, entity: singular, operation: "create", payload: { id, name: name.trim(), status: "active" } })
      setItems((current) => [{ id, name: name.trim(), description: null, status: "active", updated_at: new Date().toISOString(), sync_state: "pending" }, ...current])
      setName("")
    }
    setBusy(false)
  }
  const archive = async (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
    try {
      const response = await fetch(`/api/portfolio/${entity}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: "archived" }) })
      if (!response.ok) throw new Error("Unable to archive")
    } catch {
      if (user) await queueMutation({ ownerId: user.id, entity: singular, operation: "update", payload: { id, status: "archived" } })
    }
  }

  return <Page><PageHeader eyebrow="Shape the bigger picture" title={capitalize(entity)} description={entity === "projects" ? "Group related tasks into meaningful outcomes." : "Keep longer-term intentions visible without adding pressure."} />
    {enabled === null ? <div className="flex min-h-48 items-center justify-center"><LoaderCircle className="size-6 animate-spin text-primary" /></div> : !enabled ? <EmptyState icon={Settings2} title={`${capitalize(entity)} need the Phase 1 migration`} description={`The ${singular} workspace is ready, but stays quiet until the additive Projects and Goals migration is applied.`} /> : <>
      <div className="grid gap-3 sm:grid-cols-2"><PortfolioMetric icon={Icon} label={`Active ${entity}`} value={items.filter((item) => item.status === "active").length} /><PortfolioMetric icon={CircleDot} label="Total visible" value={items.length} /></div>
      <form onSubmit={create} className="dashboard-panel flex gap-2 rounded-[1.4rem] p-3"><Input aria-label={`New ${singular} name`} value={name} onChange={(event) => setName(event.target.value)} placeholder={`Name your next ${singular}`} maxLength={160} /><Button disabled={busy || !name.trim()}><Plus />Add {singular}</Button></form>
      <div className="grid gap-3 md:grid-cols-2">{items.map((item) => <Card key={item.id} className="dashboard-panel-hover"><CardContent className="flex min-h-36 items-start gap-3 p-5"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><Icon className="size-5" /></div><div className="min-w-0 flex-1"><Link href={`/dashboard/${entity}/${item.id}`} className="group flex items-center gap-2 font-semibold tracking-[-.02em] hover:text-primary">{item.name}<ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" /></Link><p className="mt-1 text-xs font-medium capitalize text-primary">{item.status}{item.sync_state === "pending" ? " · Pending sync" : ""}</p><p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.description || `Open this ${singular} to review its related work and keep the outcome moving.`}</p></div><Button size="icon" variant="ghost" aria-label={`Archive ${item.name}`} onClick={() => archive(item.id)}><Archive /></Button></CardContent></Card>)}</div>
      {!items.length && <EmptyState icon={Icon} title={`No ${entity} yet`} description={`Create your first ${singular} to give related work a calmer home.`} />}
    </>}
  </Page>
}

function PortfolioMetric({ icon: Icon, label, value }: { icon: typeof BriefcaseBusiness; label: string; value: number }) {
  return <div className="dashboard-panel flex items-center gap-3 rounded-2xl p-4"><div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><Icon className="size-5" /></div><div><p className="text-2xl font-semibold tracking-[-.04em]">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></div>
}

function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1) }
