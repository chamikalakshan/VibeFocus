"use client"

import { useState } from "react"
import { Check, Headphones, Link2, Music2, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { builtinAudioSource, parseFocusAudioSource, type FocusAudioSource } from "@/lib/domain/audio-source"
import { cn } from "@/lib/utils"

export function FocusAudioSourceDialog({ open, onOpenChange, source, onSourceChange }: { open: boolean; onOpenChange: (open: boolean) => void; source: FocusAudioSource; onSourceChange: (source: FocusAudioSource) => void }) {
  const [link, setLink] = useState(source.kind === "builtin" ? "" : source.url)
  const [error, setError] = useState("")

  const saveLink = () => {
    const parsed = parseFocusAudioSource(link)
    if (!parsed) {
      setError("Paste a valid YouTube video or playlist link, or a Spotify track, playlist, album, or podcast link.")
      return
    }
    onSourceChange(parsed)
    setError("")
    onOpenChange(false)
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="dashboard-panel max-h-[90vh] overflow-y-auto rounded-[1.4rem] sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Choose your Lo-Fi Radio source</DialogTitle>
        <DialogDescription>Use the built-in uninterrupted loop or bring audio from a service you already use.</DialogDescription>
      </DialogHeader>
      <button onClick={() => { onSourceChange(builtinAudioSource); setError(""); onOpenChange(false) }} className={cn("flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors hover:bg-[var(--surface-hover)]", source.kind === "builtin" && "border-primary/40 bg-[var(--accent-soft)]")}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Headphones className="size-5" /></span>
        <span className="flex-1"><span className="block text-sm font-semibold">VibeFocus Lo-Fi</span><span className="mt-1 block text-xs text-muted-foreground">Built-in, looped, and controlled by the volume slider.</span></span>
        {source.kind === "builtin" && <Check className="size-5 text-primary" />}
      </button>
      <div className="rounded-2xl border bg-[var(--surface-secondary)] p-4">
        <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><Link2 className="size-5" /></span><div><p className="text-sm font-semibold">Custom audio source</p><p className="text-xs text-muted-foreground">Official embedded players keep account playback secure.</p></div></div>
        <label className="mt-4 block space-y-2 text-sm font-medium">YouTube or Spotify link<Input value={link} onChange={(event) => { setLink(event.target.value); setError("") }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveLink() } }} placeholder="https://youtube.com/... or https://open.spotify.com/..." aria-invalid={Boolean(error)} /></label>
        {error && <p role="alert" className="mt-2 text-xs leading-5 text-[var(--danger)]">{error}</p>}
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1"><Youtube className="size-3.5" />Video or playlist</span><span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1"><Music2 className="size-3.5" />Track, playlist, album, podcast</span></div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">Direct MP3 uploads and more built-in stations can be added later. Custom links are currently remembered on this device.</p>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={saveLink} disabled={!link.trim()}>Use custom source</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
