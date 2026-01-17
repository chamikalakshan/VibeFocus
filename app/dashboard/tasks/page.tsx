import { Suspense } from "react"
import { getTasks } from "@/actions/task"
import { TaskList } from "@/components/task-list"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
    title: "Tasks | VibeFocus",
    description: "Manage your daily tasks with VibeFocus.",
}

export default async function TaskPage() {
    const tasks = await getTasks()

    return (
        <div className="container max-w-4xl py-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Today's Focus</h1>
                <p className="text-muted-foreground text-lg">
                    Capture what matters. clear the noise.
                </p>
            </div>

            <Suspense fallback={<TaskSkeleton />}>
                {/* Pass tasks directly. Since this is a server component, 
            it will re-fetch on revalidatePath and pass new props to TaskList. */}
                <TaskList initialTasks={tasks} />
            </Suspense>
        </div>
    )
}

function TaskSkeleton() {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-14 w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
            </div>
        </div>
    )
}
