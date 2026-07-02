"use client"

import { useState } from "react"
import { parseBulkTasks, type taskSuggestionSchema } from "@/lib/domain/imports"
import { saveImportedTasks } from "@/actions/task"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { z } from "zod"
import { ChevronDown, FileInput, Sparkles, X } from "lucide-react"

type Suggestion = z.infer<typeof taskSuggestionSchema>

export function ImportPanel() {
  const [input, setInput] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [message, setMessage] = useState("")
  const [source, setSource] = useState<"bulk_import" | "ai_import">("bulk_import")

  const bulkPreview = () => {
    setSource("bulk_import")
    setSuggestions(parseBulkTasks(input).map((title) => ({ title, dueAt: null, priority: "medium", estimatedMinutes: null, requiredEnergy: null, category: null })))
  }
  const aiPreview = async () => {
    setSource("ai_import")
    setMessage("Creating suggestions...")
    const response = await fetch("/api/ai/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }) })
    const body = await response.json()
    if (!response.ok) { setMessage(body.error ?? "AI import failed"); return }
    setSuggestions(body.tasks)
    setMessage("")
  }
  const save = async (source: "bulk_import" | "ai_import") => {
    await saveImportedTasks(suggestions.map((task) => ({ title: task.title, priority: task.priority, due_at: task.dueAt, estimated_minutes: task.estimatedMinutes, required_energy: task.requiredEnergy, category: task.category, source })))
    setSuggestions([]); setInput(""); setMessage("Tasks imported.")
  }

  return <details className="dashboard-panel group rounded-[1.4rem] p-4 sm:p-5">
    <summary className="flex cursor-pointer list-none items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><FileInput className="size-5" /></div><div className="flex-1"><p className="font-semibold tracking-[-.02em]">Import tasks</p><p className="mt-0.5 text-xs text-muted-foreground">Turn a list or natural-language plan into editable tasks.</p></div><ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" /></summary>
    <div className="mt-5 space-y-3 border-t border-[var(--border-subtle)] pt-5">
      <Textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Paste one task per line, or describe your plans naturally." maxLength={4000} />
      <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={bulkPreview}><FileInput />Bulk Import preview</Button><Button type="button" onClick={aiPreview}><Sparkles />AI Import preview</Button></div>
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      {suggestions.length > 0 && <div className="space-y-2"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Review before saving</p><span className="text-xs text-muted-foreground">{suggestions.length} suggestion{suggestions.length === 1 ? "" : "s"}</span></div>{suggestions.map((task, index) => <div key={`${task.title}-${index}`} className="flex items-center gap-2 rounded-xl bg-[var(--surface-secondary)] p-2"><input aria-label={`Task ${index + 1}`} className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" value={task.title} onChange={(event) => setSuggestions((current) => current.map((item, i) => i === index ? { ...item, title: event.target.value } : item))} /><button className="rounded-lg p-2 text-muted-foreground hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]" aria-label={`Remove ${task.title}`} onClick={() => setSuggestions((current) => current.filter((_, i) => i !== index))}><X className="size-4" /></button></div>)}<Button onClick={() => save(source)}>Confirm {source === "ai_import" ? "AI" : "bulk"} import</Button></div>}
    </div>
  </details>
}
