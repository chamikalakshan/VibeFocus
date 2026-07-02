"use client"

import { Button } from "@/components/ui/button"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center"><h1 className="text-3xl font-bold">Something went wrong</h1><p className="text-muted-foreground">VibeFocus could not finish that request. Your existing data is safe.</p><Button onClick={reset}>Try again</Button></main>
}
