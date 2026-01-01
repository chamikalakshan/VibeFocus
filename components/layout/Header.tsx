"use client"

import { useVibe } from "@/context/VibeContext"
import { Progress } from "@/components/ui/progress"
import { Flame, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/utils/supabase/client"

export function Header() {
    const { streak, tasks } = useVibe()

    // Calculate progress based on completed vs total tasks today
    const pending = tasks.filter((t) => t.status === "pending").length
    const completed = tasks.filter(
        (t) => t.status === "completed" || t.status === "audited"
    ).length
    const total = pending + completed
    const progress = total === 0 ? 0 : (completed / total) * 100

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 p-4">
            <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="flex flex-col w-full mr-4">
                    <div className="flex justify-between items-center mb-1">
                        <h1 className="text-sm font-semibold tracking-tight text-muted-foreground">
                            Daily Goal
                        </h1>
                        <span className="text-xs font-mono text-muted-foreground">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <Progress value={progress} className="h-1" />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-orange-500">
                        <Flame className="w-5 h-5 fill-orange-500 animate-pulse" />
                        <span className="text-lg font-bold font-mono">{streak}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={async () => {
                        await supabase.auth.signOut()
                        window.location.href = "/"
                    }}>
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </header>
    )
}
