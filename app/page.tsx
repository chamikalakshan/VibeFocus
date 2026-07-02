import Link from "next/link"
import { ArrowRight, BatteryCharging, BrainCircuit, CheckCircle2, Clock3, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  { icon: BrainCircuit, title: "Choose with clarity", description: "Match the next task to your priorities, available time, and current energy." },
  { icon: Clock3, title: "Protect your attention", description: "Move into a calm, immersive timer built around one meaningful task." },
  { icon: BatteryCharging, title: "Learn what works", description: "Reflect on how work felt and discover your personal productivity patterns." },
]

export default function LandingPage() {
  return <div className="min-h-screen overflow-hidden">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Brand />
      <div className="flex items-center gap-2"><Button asChild variant="ghost"><Link href="/login">Log in</Link></Button><Button asChild><Link href="/login">Start focusing<ArrowRight /></Link></Button></div>
    </header>

    <main>
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:py-20">
        <div className="max-w-3xl">
          <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary"><Sparkles className="size-3.5" />Energy-aware productivity</div>
          <h1 className="text-5xl font-semibold leading-[.98] tracking-[-0.065em] sm:text-7xl lg:text-[5.7rem]">Focus on the work that fits <span className="text-primary">right now.</span></h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">VibeFocus turns an overwhelming task list into one clear next move, a protected focus session, and insight you can actually use.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="accent-glow"><Link href="/login">Build today&apos;s focus plan<ArrowRight /></Link></Button><Button asChild size="lg" variant="outline"><Link href="#how-it-works">See how it works</Link></Button></div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[var(--success)]" />No clutter</span><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[var(--success)]" />Works offline</span><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[var(--success)]" />Private by design</span></div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-8 rounded-full bg-primary/20 blur-3xl" />
          <div className="dashboard-panel accent-glow subtle-grid relative overflow-hidden rounded-[2rem] border-primary/20 p-5 sm:p-7">
            <div className="flex items-center justify-between"><Brand compact /><span className="rounded-full bg-[var(--success-soft)] px-3 py-1 text-xs font-medium text-[var(--success)]">Synced</span></div>
            <div className="mt-12"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Recommended next</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Shape the launch story</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">High priority, due soon, and a good match for your current energy.</p></div>
            <div className="mt-8 flex items-center justify-between gap-3"><div><p className="text-xs text-muted-foreground">Today</p><p className="mt-1 text-2xl font-semibold tracking-[-.04em]">3 of 5 done</p></div><div className="flex size-24 items-center justify-center rounded-full bg-[conic-gradient(var(--accent-primary)_60%,var(--surface-secondary)_0)]"><div className="flex size-[4.8rem] items-center justify-center rounded-full bg-[var(--surface-primary)] text-lg font-semibold">60%</div></div></div>
            <Button className="mt-7 w-full" size="lg"><Clock3 />Start a 25 minute focus</Button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 pb-24 sm:px-8"><div className="mb-8 max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">A calmer loop</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Plan less. Notice more. Finish what matters.</h2></div><div className="grid gap-4 md:grid-cols-3">{features.map(({ icon: Icon, title, description }, index) => <div key={title} className="dashboard-panel dashboard-panel-hover rounded-[1.4rem] p-6"><div className="flex items-center justify-between"><div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-primary"><Icon className="size-6" /></div><span className="text-xs font-bold tracking-[.18em] text-muted-foreground">0{index + 1}</span></div><h3 className="mt-8 text-xl font-semibold tracking-[-.03em]">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>)}</div></section>
    </main>
    <footer className="border-t border-[var(--border-subtle)] px-5 py-6 text-center text-xs text-muted-foreground">VibeFocus · Calm, intelligent focus for everyday work.</footer>
  </div>
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3"><div className="accent-glow flex size-10 items-center justify-center rounded-[.9rem] bg-primary text-primary-foreground"><Sparkles className="size-5" /></div>{!compact && <div><span className="block font-semibold tracking-[-.04em]">VibeFocus</span><span className="block text-[9px] font-bold uppercase tracking-[.18em] text-muted-foreground">Focus workspace</span></div>}</div>
}
