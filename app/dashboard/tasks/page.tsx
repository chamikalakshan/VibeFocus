import { TaskFeed } from "@/components/dashboard/TaskFeed"

export const metadata = {
    title: "Tasks | VibeFocus",
    description: "Manage your daily tasks with VibeFocus.",
}

export default function TaskPage() {
    return (
        <div className="container max-w-4xl py-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Today's Focus</h1>
                <p className="text-muted-foreground text-lg">
                    Capture what matters. clear the noise.
                </p>
            </div>

            <TaskFeed hideCompleted={false} />
        </div>
    )
}


