import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return <main className="mx-auto max-w-5xl space-y-4 p-8" aria-label="Loading"><Skeleton className="h-10 w-56" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></main>
}
