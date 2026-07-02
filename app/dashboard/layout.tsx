"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, BatteryCharging, BriefcaseBusiness, CalendarDays, CheckSquare2, ChevronLeft, CircleUserRound, Cloud, CloudOff, Focus, Goal, LogOut, MoreHorizontal, Plus, Settings, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ActiveFocusMode } from "@/components/features/ActiveFocusMode"
import { supabase } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"

const mainItems = [
  { icon: CalendarDays, label: "Today", href: "/dashboard/today" },
  { icon: CheckSquare2, label: "Tasks", href: "/dashboard/tasks" },
  { icon: BriefcaseBusiness, label: "Projects", href: "/dashboard/projects", gated: true },
  { icon: Goal, label: "Goals", href: "/dashboard/goals", gated: true },
  { icon: Focus, label: "Focus", href: "/dashboard/focus" },
  { icon: BarChart3, label: "Insights", href: "/dashboard/insights" },
]
const secondaryItems = [
  { icon: BatteryCharging, label: "Energy audit", href: "/dashboard/audit" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: CircleUserRound, label: "Profile", href: "/dashboard/profile" },
]
const mobileItems = [mainItems[0], mainItems[1], mainItems[4], mainItems[5]]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [projectsEnabled, setProjectsEnabled] = useState(false)
  const online = useSyncExternalStore(subscribeToConnection, getConnectionSnapshot, getServerConnectionSnapshot)

  useEffect(() => {
    fetch("/api/schema/capabilities", { cache: "no-store" }).then((response) => response.json()).then((value) => setProjectsEnabled(Boolean(value.projects && value.goals))).catch(() => setProjectsEnabled(false))
    const timeout = window.setTimeout(() => setCollapsed(localStorage.getItem("vibefocus_sidebar_collapsed") === "true"), 0)
    return () => window.clearTimeout(timeout)
  }, [])

  const toggleCollapsed = () => setCollapsed((value) => {
    localStorage.setItem("vibefocus_sidebar_collapsed", String(!value))
    return !value
  })
  const logout = async () => { await supabase.auth.signOut(); router.push("/login"); router.refresh() }
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return <div className="min-h-screen">
    <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:translate-y-0">Skip to content</a>
    <aside className={cn("fixed inset-y-3 left-3 z-40 hidden overflow-hidden rounded-[1.6rem] border border-[var(--border-subtle)] bg-[color:var(--background-subtle)/0.88] shadow-[var(--shadow-elevated)] backdrop-blur-2xl transition-[width] md:flex md:flex-col", collapsed ? "w-[4.5rem]" : "w-60")}>
      <div className="flex h-20 items-center gap-3 px-4"><div className="accent-glow flex size-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-primary text-primary-foreground"><Sparkles className="size-5" /></div>{!collapsed && <div><span className="block text-lg font-semibold tracking-[-0.04em]">VibeFocus</span><span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Focus workspace</span></div>}</div>
      <nav aria-label="Primary navigation" className="flex-1 space-y-1 px-3">
        {mainItems.map((item) => <NavItem key={item.href} item={item} collapsed={collapsed} active={active(item.href)} disabled={Boolean(item.gated && !projectsEnabled)} />)}
      </nav>
      <nav aria-label="Account navigation" className="space-y-1 border-t border-[var(--border-subtle)] p-3">
        {secondaryItems.map((item) => <NavItem key={item.href} item={item} collapsed={collapsed} active={active(item.href)} />)}
        <button onClick={logout} className={cn("flex min-h-11 w-full items-center rounded-xl px-3 text-sm text-muted-foreground hover:bg-[var(--surface-hover)] hover:text-[var(--danger)]", collapsed ? "justify-center" : "gap-3")}><LogOut className="size-5" />{!collapsed && "Log out"}</button>
        <button onClick={toggleCollapsed} className={cn("flex min-h-11 w-full items-center rounded-xl px-3 text-sm text-muted-foreground hover:bg-[var(--surface-hover)]", collapsed ? "justify-center" : "gap-3")}><ChevronLeft className={cn("size-5 transition-transform", collapsed && "rotate-180")} />{!collapsed && "Collapse"}</button>
      </nav>
    </aside>

    <div className={cn("min-h-screen transition-[padding]", collapsed ? "md:pl-[5.25rem]" : "md:pl-[15.75rem]")}>
      <header className="sticky top-0 z-30 flex h-[3.75rem] items-center justify-between border-b border-[var(--border-subtle)] bg-[color:var(--background)/0.76] px-4 backdrop-blur-2xl sm:px-6 md:px-8">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</p><p className="mt-0.5 font-semibold tracking-[-0.025em]">{routeTitle(pathname)}</p></div>
        <div className="flex items-center gap-2"><span className={cn("hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium sm:flex", online ? "border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]" : "border-[var(--warning)]/20 bg-[var(--warning-soft)] text-[var(--warning)]")}>{online ? <Cloud className="size-3.5" /> : <CloudOff className="size-3.5" />}{online ? "All changes synced" : "Working offline"}</span><Button asChild size="sm"><Link href="/dashboard/tasks#add-task"><Plus />Add task</Link></Button><Button asChild variant="secondary" size="icon" aria-label="Profile"><Link href="/dashboard/profile"><CircleUserRound /></Link></Button></div>
      </header>
      <div className="min-h-screen">{children}</div>
    </div>

    <nav aria-label="Mobile navigation" className="safe-bottom fixed inset-x-3 bottom-3 z-40 rounded-[1.4rem] border border-[var(--border-default)] bg-[color:var(--surface-elevated)/0.92] px-2 pt-2 shadow-[var(--shadow-elevated)] backdrop-blur-2xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {mobileItems.map((item) => <MobileNavItem key={item.href} item={item} active={active(item.href)} />)}
        <Sheet><SheetTrigger asChild><button className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-muted-foreground"><MoreHorizontal className="size-5" />More</button></SheetTrigger><SheetContent side="bottom" className="rounded-t-3xl pb-[calc(1rem+env(safe-area-inset-bottom))]"><SheetHeader><SheetTitle>More</SheetTitle></SheetHeader><div className="grid gap-2 px-4 pb-4">{projectsEnabled && mainItems.filter((item) => item.gated).map((item) => <NavItem key={item.href} item={item} active={active(item.href)} />)}{secondaryItems.map((item) => <NavItem key={item.href} item={item} active={active(item.href)} />)}<Button variant="ghost" className="justify-start text-[var(--danger)]" onClick={logout}><LogOut />Log out</Button></div></SheetContent></Sheet>
      </div>
    </nav>
    <ActiveFocusMode />
  </div>
}

function subscribeToConnection(callback: () => void) {
  window.addEventListener("online", callback)
  window.addEventListener("offline", callback)
  return () => {
    window.removeEventListener("online", callback)
    window.removeEventListener("offline", callback)
  }
}

function getConnectionSnapshot() {
  return navigator.onLine
}

function getServerConnectionSnapshot() {
  return true
}

function routeTitle(pathname: string) {
  const segment = pathname.split("/")[2] || "today"
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

function NavItem({ item, collapsed = false, active = false, disabled = false }: { item: typeof mainItems[number]; collapsed?: boolean; active?: boolean; disabled?: boolean }) {
  const Icon = item.icon
  if (disabled) return null
  return <Link title={collapsed ? item.label : undefined} aria-current={active ? "page" : undefined} href={item.href} className={cn("group flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-all", collapsed ? "justify-center" : "gap-3", active ? "bg-[var(--accent-soft)] text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--accent-primary)_16%,transparent)]" : "text-muted-foreground hover:bg-[var(--surface-hover)] hover:text-foreground")}><Icon className={cn("size-[1.15rem] shrink-0 transition-transform group-hover:scale-105", active && "text-primary")} />{!collapsed && item.label}</Link>
}

function MobileNavItem({ item, active }: { item: typeof mainItems[number]; active: boolean }) {
  const Icon = item.icon
  const focus = item.label === "Focus"
  return <Link aria-current={active ? "page" : undefined} href={item.href} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground", focus && "relative -mt-5")}><span className={cn("flex items-center justify-center", focus ? "size-13 rounded-full bg-primary text-primary-foreground shadow-lg" : "size-6")}><Icon className="size-5" /></span>{item.label}</Link>
}
