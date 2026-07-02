import { cn } from "@/lib/utils"

export function Page({ className, ...props }: React.ComponentProps<"main">) {
  return <main id="main-content" className={cn("page-shell page-bottom-safe space-y-9 md:space-y-10 md:pb-12", className)} {...props} />
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0 space-y-2">
      {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}
      <h1 className="text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl">{title}</h1>
      {description && <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
  </header>
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="flex items-end justify-between gap-4"><div><h2 className="text-lg font-semibold tracking-[-0.025em] sm:text-xl">{title}</h2>{description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>}</div>{action}</div>
}
