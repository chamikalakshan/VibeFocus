import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function EmptyState({ icon: Icon, title, description, action, className }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode; className?: string }) {
  return <div className={cn("surface-card flex flex-col items-center justify-center rounded-2xl px-6 py-12 text-center", className)}>
    <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-primary"><Icon className="size-6" /></div>
    <h3 className="font-semibold">{title}</h3><p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}
  </div>
}
