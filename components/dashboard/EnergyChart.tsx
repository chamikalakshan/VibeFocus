"use client"

import { useCallback, useEffect, useState } from "react"
import { getEnergyHistory } from "@/actions/energy"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { AlertCircle, BatteryCharging, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

export function EnergyChart() {
    const [data, setData] = useState<{ level: number, created_at: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const load = useCallback(() => {
        setLoading(true)
        setError("")
        getEnergyHistory().then((result) => {
            setData(result.data)
            setError(result.error ?? "")
            setLoading(false)
        }).catch(() => {
            setError("Unable to load energy history.")
            setLoading(false)
        })
    }, [])

    useEffect(() => {
        getEnergyHistory().then((result) => {
            setData(result.data)
            setError(result.error ?? "")
            setLoading(false)
        }).catch(() => {
            setError("Unable to load energy history.")
            setLoading(false)
        })
    }, [])

    if (loading) {
        return (
            <div aria-busy="true" className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading energy trends
            </div>
        )
    }

    if (error) return <Card className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-6 text-center"><AlertCircle className="size-6 text-[var(--warning)]" /><div><p className="font-semibold">Energy trends are unavailable</p><p className="mt-1 text-sm text-muted-foreground">{error}</p></div><Button size="sm" variant="outline" onClick={load}><RefreshCw />Retry</Button></Card>

    if (data.length === 0) {
        return <EmptyState icon={BatteryCharging} title="No energy pattern yet" description="Complete and audit a few tasks to reveal how different work affects you." />
    }

    const average = Math.round(data.reduce((sum, point) => sum + point.level, 0) / data.length)
    const high = Math.max(...data.map((point) => point.level))
    const low = Math.min(...data.map((point) => point.level))
    const summary = `${data.length} energy audits from the last seven days. Average ${average} percent, highest ${high} percent, lowest ${low} percent.`

    return (
        <Card className="p-6">
            <h3 className="mb-4 text-sm font-semibold tracking-[-0.015em]">Energy trends</h3>
            <p className="mb-4 text-sm text-muted-foreground">{summary}</p>
            <div role="img" aria-label={summary} className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="created_at"
                            hide
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "var(--surface-elevated)", border: "1px solid var(--border-default)", borderRadius: "12px" }}
                            itemStyle={{ color: "var(--text-primary)" }}
                            formatter={(value: number | string | undefined) => [`${value ?? 0}%`, "Energy"]}
                            labelFormatter={() => ""}
                        />
                        <Area
                            type="monotone"
                            dataKey="level"
                            stroke="#8b5cf6"
                            fillOpacity={1}
                            fill="url(#colorLevel)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
