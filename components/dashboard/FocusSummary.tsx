"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Summary {
  focus: { total_seconds: number; average_seconds: number; completed_sessions: number; cancelled_sessions: number; completion_rate: number; planned_seconds: number }
  streak: { current_streak: number; longest_streak: number }
}

export function FocusSummary() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const load = useCallback(() => {
    setState("loading")
    fetch("/api/analytics/summary", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load focus analytics")
        setSummary(await response.json())
        setState("ready")
      })
      .catch(() => setState("error"))
  }, [])
  useEffect(() => {
    fetch("/api/analytics/summary", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load focus analytics")
        setSummary(await response.json())
        setState("ready")
      })
      .catch(() => setState("error"))
  }, [])
  if (state === "loading") return <Card aria-busy="true"><CardContent className="flex min-h-36 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 animate-spin" />Loading focus history</CardContent></Card>
  if (state === "error" || !summary) return <Card><CardContent className="flex min-h-36 flex-col items-center justify-center gap-3 text-center"><AlertCircle className="size-6 text-[var(--warning)]" /><div><p className="font-semibold">Focus history is unavailable</p><p className="mt-1 text-sm text-muted-foreground">Apply the canonical analytics schema or try again after reconnecting.</p></div><Button size="sm" variant="outline" onClick={load}><RefreshCw />Retry</Button></CardContent></Card>
  const values = [
    ["Total focus", `${Math.round(summary.focus.total_seconds / 60)} min`],
    ["Average session", `${Math.round(summary.focus.average_seconds / 60)} min`],
    ["Session completion", `${summary.focus.completion_rate}%`],
    ["Longest streak", `${summary.streak.longest_streak} days`],
  ]
  return <Card className="overflow-hidden border-primary/15"><CardHeader><CardTitle className="tracking-[-0.025em]">Focus history</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2 md:grid-cols-4">{values.map(([label, value]) => <div className="rounded-2xl bg-[var(--surface-secondary)] p-4" key={label}><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{value}</p></div>)}</CardContent></Card>
}
