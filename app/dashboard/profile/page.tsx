import Link from "next/link"
import { AtSign, CircleUserRound, Clock3, Settings, ShieldCheck } from "lucide-react"
import { Page, PageHeader } from "@/components/ui/page"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/server"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const name = user?.user_metadata?.full_name ?? user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "VibeFocus user"
  const provider = user?.app_metadata?.provider ?? "email"
  return <Page className="max-w-5xl"><PageHeader eyebrow="Account" title="Profile" description="Your VibeFocus identity and secure account information." actions={<Button asChild><Link href="/dashboard/settings"><Settings />Open settings</Link></Button>} />
    <Card className="accent-glow subtle-grid overflow-hidden border-primary/20 bg-gradient-to-br from-[var(--surface-primary)] to-[var(--accent-soft)]"><CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8"><div className="flex size-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"><CircleUserRound className="size-10" /></div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Your workspace</p><h2 className="mt-2 truncate text-3xl font-semibold tracking-[-.05em] sm:text-4xl">{name}</h2><p className="mt-2 text-sm text-muted-foreground">{user?.email}</p></div><div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)]/60 px-4 py-3 text-sm"><p className="flex items-center gap-2 font-medium text-[var(--success)]"><ShieldCheck className="size-4" />Account protected</p><p className="mt-1 text-xs text-muted-foreground">Authenticated through {provider}</p></div></CardContent></Card>
    <section className="grid gap-3 md:grid-cols-3"><ProfileDetail icon={AtSign} label="Email address" value={user?.email ?? "Not available"} /><ProfileDetail icon={ShieldCheck} label="Sign-in provider" value={provider} /><ProfileDetail icon={Clock3} label="Member since" value={user?.created_at ? new Date(user.created_at).toLocaleDateString([], { month: "long", year: "numeric" }) : "Not available"} /></section>
  </Page>
}

function ProfileDetail({ icon: Icon, label, value }: { icon: typeof AtSign; label: string; value: string }) {
  return <Card><CardContent className="p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><Icon className="size-5" /></div><p className="mt-5 text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold capitalize">{value}</p></CardContent></Card>
}
