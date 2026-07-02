import { z } from "zod"

export const taskSuggestionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  dueAt: z.string().datetime().nullable(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  estimatedMinutes: z.number().int().positive().max(1440).nullable(),
  requiredEnergy: z.enum(["low", "medium", "high"]).nullable(),
  category: z.string().trim().max(80).nullable(),
})

export const taskSuggestionsSchema = z.array(taskSuggestionSchema).max(50)

export function parseBulkTasks(input: string, existingTitles: string[] = []) {
  const existing = new Set(existingTitles.map((title) => title.trim().toLocaleLowerCase()))
  const seen = new Set<string>()
  return input.split(/\r?\n/).map((title) => title.trim()).filter((title) => {
    const key = title.toLocaleLowerCase()
    if (!title || existing.has(key) || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
