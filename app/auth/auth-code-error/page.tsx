"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, ShieldAlert } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

function ErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")
    const message = searchParams.get("message")

    return (
        <main className="subtle-grid flex min-h-screen items-center justify-center p-4"><Card className="accent-glow w-full max-w-md border-[var(--danger)]/20"><CardContent className="p-8 text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)]"><ShieldAlert className="size-7" /></div><p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-[var(--danger)]">Authentication error</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em]">We could not complete sign in</h1><div className="mt-5 rounded-2xl bg-[var(--surface-secondary)] p-4 text-left"><p className="font-mono text-xs font-semibold text-[var(--danger)]">{error || "unknown_error"}</p>{message && <p className="mt-2 text-sm leading-5 text-muted-foreground">{message}</p>}{!error && !message && <p className="mt-2 text-sm text-muted-foreground">An unknown error occurred. Try signing in again.</p>}</div><Button asChild className="mt-6"><Link href="/login"><ArrowLeft />Back to sign in</Link></Button></CardContent></Card></main>
    )
}

export default function AuthCodeError() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>}>
            <ErrorContent />
        </Suspense>
    )
}
