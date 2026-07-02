import Link from "next/link"
import { CloudOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function OfflinePage() {
  return <main className="subtle-grid flex min-h-screen items-center justify-center p-6"><Card className="accent-glow w-full max-w-md"><CardContent className="p-8 text-center"><div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[var(--warning-soft)] text-[var(--warning)]"><CloudOff className="size-8" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-[var(--warning)]">Working offline</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Your focus can continue</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Cached tasks and your active timer remain available. Eligible changes will sync automatically when the connection returns.</p><Button asChild className="mt-6" variant="outline"><Link href="/dashboard/today"><RefreshCw />Return to Today</Link></Button></CardContent></Card></main>
}
