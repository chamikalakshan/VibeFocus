"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { LayoutDashboard, CheckCircle2, Zap, Settings, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { supabase } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: CheckCircle2, label: "All Tasks", href: "/dashboard/tasks" },
    { icon: Zap, label: "Analytics", href: "/dashboard/analytics" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push("/login")
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r bg-card/50 backdrop-blur-xl h-screen sticky top-0">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        VibeFocus
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                    }`}>
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="sidebar-active"
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                                        />
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t">
                    <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={handleLogout}>
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-background/80 backdrop-blur z-50 flex items-center justify-between px-4">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    VF
                </h1>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <div className="p-6 border-b">
                            <h1 className="text-2xl font-bold">VibeFocus</h1>
                        </div>
                        <nav className="flex-1 p-4 space-y-2">
                            {sidebarItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <Button variant="ghost" className="w-full justify-start mb-2">
                                            <Icon className="w-5 h-5 mr-3" />
                                            {item.label}
                                        </Button>
                                    </Link>
                                )
                            })}
                            <Button variant="ghost" className="w-full justify-start text-red-500 mt-4" onClick={handleLogout}>
                                <LogOut className="w-5 h-5 mr-3" />
                                Logout
                            </Button>
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:overflow-y-auto">
                {/* Spacer for fixed mobile header */}
                <div className="h-16 md:hidden" />
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    )
}
