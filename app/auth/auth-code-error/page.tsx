"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function ErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")
    const message = searchParams.get("message")

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-500">Authentication Error</h1>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100 max-w-md w-full">
                <p className="font-mono text-sm text-red-700 font-bold mb-2">{error}</p>
                {message && <p className="text-sm text-red-600">{message}</p>}
                {!error && !message && <p className="text-gray-600">Unknown error occurred.</p>}
            </div>

            <Button asChild>
                <Link href="/login">Back to Login</Link>
            </Button>
        </div>
    )
}

export default function AuthCodeError() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ErrorContent />
        </Suspense>
    )
}
