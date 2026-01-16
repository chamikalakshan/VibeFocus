"use client"

import { useEffect, useState } from "react"
import { getEnergyHistory } from "@/actions/energy"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function EnergyChart() {
    const [data, setData] = useState<{ level: number, created_at: string }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getEnergyHistory().then((history) => {
            setData(history)
            setLoading(false)
        })
    }, [])

    if (loading) {
        return (
            <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">
                No energy data yet. Complete and audit tasks!
            </div>
        )
    }

    return (
        <Card className="p-6 bg-black/40 border-white/5 backdrop-blur-xl">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Energy Trends</h3>
            <div className="h-[200px] w-full">
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
                            contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                            itemStyle={{ color: "#fff" }}
                            formatter={(value: any) => [`${value}%`, "Energy"]}
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
