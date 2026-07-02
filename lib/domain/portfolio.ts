export function portfolioProgress(taskStatuses: Array<"pending" | "completed" | "archived">) {
  const relevant = taskStatuses.filter((status) => status !== "archived")
  if (!relevant.length) return 0
  return Math.round(relevant.filter((status) => status === "completed").length / relevant.length * 100)
}
