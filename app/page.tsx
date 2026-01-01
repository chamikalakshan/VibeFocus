import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, CheckCircle2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-black fill-black" />
          </div>
          <span className="font-bold text-xl tracking-tighter">VibeFocus</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/login">
            <Button>Get Standard</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
            Stop Managing <br /> Start Vibing.
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto">
            The minimalist productivity tool for the Gen Z professional.
            Focus timers, energy audits, and zero clutter.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto h-12 text-base group">
              Start Focusing Now
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Feature Grid Mini */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold">Focus Mode</h3>
            <p className="text-sm text-muted-foreground">Immersive timer with curated lo-fi vibes.</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold">Energy Audit</h3>
            <p className="text-sm text-muted-foreground">Swipe completed tasks to track your energy.</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold">Sync Anywhere</h3>
            <p className="text-sm text-muted-foreground">Seamless cloud sync across all your devices.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        © 2024 VibeFocus. Built mostly by AI.
      </footer>
    </div>
  )
}

function Layers(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16.02 12 5.48 3.13a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0L2.5 16.87a1 1 0 0 1 0-1.74l5.48-3.13" />
      <path d="M5.7 15.13 12 18.74l6.3-3.61" />
      <path d="m12 18.74-5.6-3.21" />
    </svg>
  )
}
