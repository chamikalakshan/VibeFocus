"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, CheckCircle2, Loader2, Mail, Sparkles } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { supabase } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setIsLoading(true); setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } })
      if (error) throw error
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to sign in"); setIsLoading(false) }
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); setIsLoading(true); setError(null)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}` } })
      if (error) throw error
      setIsSent(true)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Unable to send magic link") } finally { setIsLoading(false) }
  }

  return <main className="subtle-grid relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
    <div className="pointer-events-none absolute left-1/2 top-1/3 size-[34rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
    <div className="relative w-full max-w-md">
      <Link href="/" className="mb-5 flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to VibeFocus</Link>
      <Card className="accent-glow overflow-hidden border-primary/15 bg-[color:var(--surface-primary)/.94]">
        <CardContent className="p-7 sm:p-9">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"><Sparkles className="size-6" /></div>
          {isSent ? <div className="mt-7 text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]"><CheckCircle2 className="size-7" /></div><h1 className="mt-5 text-3xl font-semibold tracking-[-.05em]">Check your email</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">We sent a secure magic link to <span className="font-medium text-foreground">{email}</span>.</p><Button className="mt-6" variant="outline" onClick={() => setIsSent(false)}>Use another email</Button></div> : <>
            <div className="mt-7 text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Welcome back</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Return to your focus</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to sync your plan, sessions, and insights.</p></div>
            <form onSubmit={handleLogin} className="mt-7 space-y-3"><label className="block space-y-2 text-sm font-medium">Email address<Input aria-label="Email address" type="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>{error && <p role="alert" className="rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">{error}</p>}<Button type="submit" size="lg" className="w-full" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : <Mail />}Send magic link</Button></form>
            <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-[var(--border-subtle)]" /><span className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">or continue with</span><span className="h-px flex-1 bg-[var(--border-subtle)]" /></div>
            <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}><FcGoogle className="size-4" />Google</Button>
          </>}
        </CardContent>
      </Card>
      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Your data stays private and is protected by account-level access controls.</p>
    </div>
  </main>
}
