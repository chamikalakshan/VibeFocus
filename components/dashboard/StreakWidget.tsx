"use client"

import { useVibe } from "@/context/VibeContext"
import { motion } from "framer-motion"
import { Flame } from "lucide-react"

export function StreakWidget() {
    const { streak } = useVibe()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 p-6"
        >
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <Flame className="w-24 h-24 text-orange-500" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-orange-500/20 rounded-full">
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                    </div>
                    <span className="text-sm font-medium text-orange-200 uppercase tracking-wider">Current Streak</span>
                </div>

                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white tracking-tighter">
                        {streak}
                    </span>
                    <span className="text-xl text-muted-foreground font-medium">days</span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                    Keep the vibe alive! You're on fire.
                </p>
            </div>
        </motion.div>
    )
}
