"use client"

import { useId, useState } from "react"
import { ArrowLeft, Check, Clock3, Expand, Focus, Link2, Music2, Pause, Pencil, Play, RotateCcw, Settings2, Volume2, VolumeX, Zap } from "lucide-react"
import type { Task } from "@/context/VibeContext"
import type { FocusAudioSource } from "@/lib/domain/audio-source"
import { focusAudioPlayerUrl, parseFocusAudioSource } from "@/lib/domain/audio-source"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { YouTubeFocusPlayer } from "@/components/features/YouTubeFocusPlayer"

export function FocusTopBar({ onExit, onSettings, onFullscreen }: { onExit: () => void; onSettings: () => void; onFullscreen: () => void }) {
  return <header className="focus-glass flex min-h-16 items-center justify-between rounded-2xl px-3 py-2 sm:px-5">
    <button onClick={onExit} className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-left hover:bg-white/5"><ArrowLeft className="size-5" /><span><span className="block text-sm font-semibold">Exit Session</span><span className="hidden text-[11px] text-muted-foreground sm:block">Back to dashboard</span></span></button>
    <p className="text-lg font-semibold tracking-[-.04em]">Vibe<span className="text-primary">Focus</span></p>
    <div className="flex gap-1.5"><Button variant="ghost" size="icon" aria-label="Audio settings" onClick={onSettings}><Settings2 /></Button><Button variant="ghost" size="icon" aria-label="Toggle fullscreen" onClick={onFullscreen}><Expand /></Button></div>
  </header>
}

export function SessionDetailsPanel({ task, duration, canEdit, onEditTask, onEditDuration }: { task: Task; duration: number; canEdit: boolean; onEditTask: () => void; onEditDuration: () => void }) {
  const energy = task.required_energy ?? "medium"
  const energyLabel = energy === "medium" ? "Balanced" : `${energy.charAt(0).toUpperCase()}${energy.slice(1)}`
  const bars = energy === "high" ? 5 : energy === "medium" ? 3 : 2
  return <aside className="focus-glass rounded-3xl p-5">
    <PanelTitle icon={Focus}>Session</PanelTitle>
    <section className="mt-5 rounded-2xl border border-white/8 bg-black/10 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Current task</p>
      <div className="mt-3 flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><Focus className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{task.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{task.description || "One clear task. One protected block of time."}</p></div><Button variant="ghost" size="icon-sm" aria-label="Edit task title" disabled={!canEdit} onClick={onEditTask}><Pencil /></Button></div>
    </section>
    <div className="mt-4 divide-y divide-white/8 border-y border-white/8">
      <DetailRow icon={Clock3} label="Focus duration" value={`${Math.round(duration / 60)} min`} action={<Button variant="outline" size="sm" disabled={!canEdit} onClick={onEditDuration}>Edit</Button>} />
      <DetailRow icon={Zap} label="Energy level" value={energyLabel} action={<div className="flex h-7 items-end gap-1" aria-label={`${energyLabel} required energy`}>{[1, 2, 3, 4, 5].map((bar) => <span key={bar} className={cn("w-1.5 rounded-full", bar <= bars ? "bg-primary" : "bg-white/8")} style={{ height: `${7 + bar * 3}px` }} />)}</div>} />
    </div>
    <blockquote className="mt-5 text-xs leading-6 text-muted-foreground"><span className="mb-1 block text-3xl leading-none text-primary">“</span>Discipline is choosing between what you want now and what you want most.</blockquote>
  </aside>
}

export function FocusTimerHero({ title, time, progress, sandProgress, isActive, isEditing, editedTitle, onEditedTitleChange, onEditStart, onEditSave, ringRef, ringHandlers }: { title: string; time: string; progress: number; sandProgress: number; isActive: boolean; isEditing: boolean; editedTitle: string; onEditedTitleChange: (value: string) => void; onEditStart: () => void; onEditSave: () => void; ringRef: React.RefObject<HTMLDivElement | null>; ringHandlers: { onMouseDown: (event: React.MouseEvent) => void; onMouseMove: (event: React.MouseEvent) => void; onTouchStart: (event: React.TouchEvent) => void; onTouchMove: (event: React.TouchEvent) => void } }) {
  const radius = 142
  const circumference = 2 * Math.PI * radius
  return <main className="order-first flex min-w-0 flex-col items-center text-center lg:order-none">
    <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-primary"><span className="mr-2 inline-block size-2 rounded-full border border-primary" />Focus Session</div>
    {isEditing ? <Input autoFocus value={editedTitle} onChange={(event) => onEditedTitleChange(event.target.value)} onBlur={onEditSave} onKeyDown={(event) => event.key === "Enter" && onEditSave()} className="mt-3 max-w-md border-x-0 border-t-0 bg-transparent text-center text-3xl font-semibold" /> : <button onClick={onEditStart} disabled={isActive} className="mt-3 max-w-xl truncate text-3xl font-semibold tracking-[-.05em] disabled:cursor-default sm:text-4xl">{title}</button>}
    <p className="mt-1 text-sm text-muted-foreground">Stay focused. Build your future.</p>
    <div ref={ringRef} {...ringHandlers} className={cn("focus-ring-shell relative mt-5 flex size-[min(72vw,27rem)] touch-none items-center justify-center rounded-full", !isActive && "cursor-pointer")}>
      <svg viewBox="0 0 340 340" className="pointer-events-none absolute inset-0 size-full -rotate-90">
        <circle cx="170" cy="170" r={radius} className="fill-none stroke-white/5" strokeWidth="8" />
        <circle cx="170" cy="170" r={radius} className="fill-none stroke-primary" strokeWidth="9" strokeLinecap="round" style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - progress), transition: isActive ? "stroke-dashoffset 1s linear" : "none" }} />
      </svg>
      <div className="relative z-10 flex flex-col items-center"><AnimatedHourglass active={isActive} progress={sandProgress} /><span role="timer" className="timer-numerals -mt-1 font-mono text-5xl font-semibold drop-shadow-2xl sm:text-6xl">{time}</span><span className="mt-1 text-[10px] font-bold uppercase tracking-[.22em] text-primary">Time remaining</span></div>
    </div>
  </main>
}

export function AnimatedHourglass({ active, progress }: { active: boolean; progress: number }) {
  const id = useId().replace(/:/g, "")
  const [flipped, setFlipped] = useState(false)
  const elapsed = Math.max(0, Math.min(1, 1 - progress))
  const halfWidth = 112 * Math.min(1, elapsed * 1.1)
  const emptyReachY = 356 - 264 * elapsed
  const pileApexY = 648 - 264 * elapsed
  const topBulb = "M98,92 A112,16 0 0 1 322,92 C352,214 300,314 220,356 L200,356 C120,314 68,214 98,92 Z"
  const bottomBulb = "M200,384 C120,426 68,526 98,648 A112,16 0 0 0 322,648 C352,526 300,426 220,384 Z"
  const topSand = `${topBulb} M210,356 L${210 - halfWidth},${emptyReachY} L${210 + halfWidth},${emptyReachY} Z`
  const bottomSand = `M210,${pileApexY} L${210 - halfWidth},648 L${210 + halfWidth},648 Z`
  const ornaments = Array.from({ length: 18 }, (_, index) => {
    const angle = (index / 18) * Math.PI * 2
    return { x: 210 + Math.cos(angle) * 126, y: Math.sin(angle) * 20 }
  })

  return <button type="button" aria-label="Flip decorative hourglass" title="Flip hourglass" onPointerDown={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); setFlipped((value) => !value) }} className={cn("focus-hourglass relative h-52 w-32 border-0 bg-transparent p-0 outline-none sm:h-56 sm:w-36", active && "is-active", flipped && "is-flipped")}>
    <span aria-hidden className="hourglass-ambient" />
    <svg viewBox="0 0 420 740" className="size-full overflow-visible drop-shadow-[0_18px_22px_rgba(0,0,0,.75)]">
      <defs>
        <radialGradient id={`${id}-brass`} cx="35%" cy="30%" r="75%"><stop stopColor="#fff6dc" /><stop offset=".3" stopColor="#f0c878" /><stop offset=".6" stopColor="#b8822f" /><stop offset="1" stopColor="#3d2308" /></radialGradient>
        <linearGradient id={`${id}-cylinder`} x1="0" y1="0" x2="1" y2="0"><stop stopColor="#2b1604" /><stop offset=".22" stopColor="#a8732e" /><stop offset=".5" stopColor="#fdeec0" /><stop offset=".78" stopColor="#a8732e" /><stop offset="1" stopColor="#2b1604" /></linearGradient>
        <pattern id={`${id}-twist`} width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(32)"><rect width="24" height="24" fill="transparent" /><rect width="12" height="24" fill="#150b01" opacity=".4" /></pattern>
        <linearGradient id={`${id}-top-sand`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff0c4" /><stop offset=".55" stopColor="#eda53d" /><stop offset="1" stopColor="#b9711c" /></linearGradient>
        <linearGradient id={`${id}-bottom-sand`} x1="0" y1="1" x2="0" y2="0"><stop stopColor="#c9821f" /><stop offset=".6" stopColor="#eda53d" /><stop offset="1" stopColor="#fff0c4" /></linearGradient>
        <radialGradient id={`${id}-glass`} cx="35%" cy="15%" r="85%"><stop stopColor="#fff" stopOpacity=".14" /><stop offset=".45" stopColor="#fff" stopOpacity=".03" /><stop offset="1" stopColor="#a0beff" stopOpacity=".02" /></radialGradient>
        <linearGradient id={`${id}-highlight`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity="0" /><stop offset=".32" stopColor="#fff" stopOpacity=".22" /><stop offset=".4" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <clipPath id={`${id}-top-clip`}><path d={topBulb} /></clipPath>
        <clipPath id={`${id}-bottom-clip`}><path d={bottomBulb} /></clipPath>
        <filter id={`${id}-soft`}><feGaussianBlur stdDeviation="3" /></filter>
      </defs>

      <g className="hourglass-render">
        <ellipse cx="210" cy="682" rx="142" ry="28" fill="#e89628" opacity=".18" filter={`url(#${id}-soft)`} />
        {[62, 336].map((x) => <g key={x} className="hourglass-post"><rect x={x} y="40" width="22" height="660" rx="6" fill={`url(#${id}-cylinder)`} /><rect x={x} y="40" width="22" height="660" rx="6" fill={`url(#${id}-twist)`} /></g>)}

        <path d={bottomBulb} fill={`url(#${id}-glass)`} />
        <g clipPath={`url(#${id}-bottom-clip)`}><path d={bottomSand} fill={`url(#${id}-bottom-sand)`} /></g>
        <path d={topBulb} fill={`url(#${id}-glass)`} />
        <g clipPath={`url(#${id}-top-clip)`}><path d={topSand} fill={`url(#${id}-top-sand)`} fillRule="evenodd" /></g>
        <rect x="200" y="356" width="20" height="28" fill="#fff" opacity=".05" />
        <path d={topBulb} fill={`url(#${id}-highlight)`} />
        <path d={bottomBulb} fill={`url(#${id}-highlight)`} />
        <path d={topBulb} fill="none" stroke="#caa15a" strokeWidth="2" opacity=".5" />
        <path d={bottomBulb} fill="none" stroke="#caa15a" strokeWidth="2" opacity=".5" />
        <path className="hourglass-stream" d="M210 358v25" stroke={`url(#${id}-top-sand)`} strokeWidth="4" strokeLinecap="round" />
        <g className="hourglass-particles" fill="#ffe7a0"><circle cx="207" cy="362" r="2.2" /><circle cx="213" cy="369" r="1.7" /><circle cx="209" cy="376" r="2" /><circle cx="212" cy="381" r="1.3" /></g>

        {[64, 676].map((cy) => <g key={cy}>
          <ellipse cx="210" cy={cy} rx="140" ry="24" fill={`url(#${id}-brass)`} />
          <ellipse cx="210" cy={cy} rx="140" ry="24" fill="none" stroke="#fff4d6" strokeWidth="1.5" opacity=".55" />
          <ellipse cx="210" cy={cy + (cy < 100 ? 8 : -8)} rx="122" ry="18" fill="none" stroke="#2b1604" strokeWidth="2" opacity=".5" />
          <ellipse cx="210" cy={cy + (cy < 100 ? 12 : -12)} rx="105" ry="13" fill="none" stroke="#fff4d6" opacity=".4" />
          {ornaments.map((ornament, index) => <rect key={index} x={ornament.x - 3} y={cy + ornament.y - 3} width="6" height="6" transform={`rotate(45 ${ornament.x} ${cy + ornament.y})`} fill="#2b1604" opacity=".5" />)}
          <ellipse cx="210" cy={cy} rx="16" ry="6" fill="#2b1604" opacity=".55" />
          <ellipse cx="210" cy={cy} rx="16" ry="6" fill="#2b1604" opacity=".55" transform={`rotate(90 210 ${cy})`} />
          <circle cx="210" cy={cy} r="5" fill="#fff4d6" opacity=".55" />
        </g>)}
        <rect x="203" y="36" width="14" height="30" fill={`url(#${id}-cylinder)`} /><circle cx="210" cy="28" r="14" fill={`url(#${id}-brass)`} />
        <rect x="203" y="674" width="14" height="30" fill={`url(#${id}-cylinder)`} /><circle cx="210" cy="712" r="14" fill={`url(#${id}-brass)`} />
      </g>
    </svg>
  </button>
}

export function FocusControls({ isActive, onToggle, onComplete, onReset }: { isActive: boolean; onToggle: () => void; onComplete: () => void; onReset: () => void }) {
  return <div className="mt-5 flex items-stretch justify-center gap-2 sm:gap-3">
    <ControlButton icon={isActive ? Pause : Play} label={isActive ? "Pause" : "Resume"} hint="Space" onClick={onToggle} />
    <Button size="lg" className="accent-glow min-w-36 rounded-2xl px-7" onClick={onComplete}><Check />Complete<span className="hidden text-[10px] font-normal opacity-70 sm:inline">Enter</span></Button>
    <ControlButton icon={RotateCcw} label="Reset" hint="R" onClick={onReset} />
  </div>
}

export function FocusAudioPanel({ source, enabled, active, volume, onEnabledChange, onVolumeChange, onSourceChange, onOpenSettings }: { source: FocusAudioSource; enabled: boolean; active: boolean; volume: number; onEnabledChange: (value: boolean) => void; onVolumeChange: (value: number) => void; onSourceChange: (source: FocusAudioSource) => void; onOpenSettings: () => void }) {
  const [link, setLink] = useState(source.kind === "builtin" ? "" : source.url)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const add = () => { const parsed = parseFocusAudioSource(link); if (!parsed) { setNotice(""); setError("Use a valid YouTube video/playlist or Spotify link."); return }; onSourceChange(parsed); onEnabledChange(true); setLink(parsed.url); setError(""); setNotice(`${parsed.label} saved and added.`) }
  return <aside className="focus-glass rounded-3xl p-5">
    <PanelTitle icon={Music2}>Audio</PanelTitle>
    <section className="mt-5 flex items-center gap-3 rounded-2xl border border-white/8 bg-black/10 p-4"><span className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-primary"><Music2 className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Lo-Fi Radio</p><p className="truncate text-xs text-muted-foreground">{source.label}</p></div><Switch checked={enabled} onCheckedChange={onEnabledChange} /></section>
    <section className="mt-5 border-t border-white/8 pt-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Custom audio</p><div className="mt-3 flex gap-2"><label className="relative min-w-0 flex-1"><span className="sr-only">Paste YouTube or Spotify link</span><Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={link} onChange={(event) => { setLink(event.target.value); setError(""); setNotice("") }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add() } }} className="h-10 pl-9 text-xs" placeholder="Paste YouTube or Spotify link" /></label><Button size="sm" onClick={add} disabled={!link.trim()}>Add</Button></div>{error && <p role="alert" className="mt-2 text-xs text-[var(--danger)]">{error}</p>}{notice && <p role="status" className="mt-2 text-xs text-[var(--success)]">{notice}</p>}</section>
    <section className="mt-5 border-t border-white/8 pt-5"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary">Now playing</p><Button variant="ghost" size="icon-sm" aria-label="Choose audio source" onClick={onOpenSettings}><Settings2 /></Button></div>
      <div className="mt-3 overflow-hidden rounded-2xl border border-white/8 bg-black/10 p-3">{source.kind === "youtube" && enabled ? <YouTubeFocusPlayer key={source.embedUrl} source={source} /> : source.kind === "spotify" && enabled ? <iframe key={source.embedUrl} title={`${source.label} player`} src={focusAudioPlayerUrl(source, active)} className="h-28 w-full rounded-xl" allow="autoplay; encrypted-media; picture-in-picture" loading="lazy" /> : <div className="flex min-h-24 items-center gap-3"><span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-[radial-gradient(circle_at_30%_20%,var(--accent-primary),var(--surface-secondary))]"><Music2 className="size-7 text-white" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold">{source.label}</p><p className="mt-1 text-xs text-muted-foreground">{enabled ? active ? "Playing softly" : "Starts with your timer" : "Radio is off"}</p></div></div>}
        {source.kind === "builtin" && <div className="mt-3 flex items-center gap-2"><button aria-label={volume ? "Mute audio" : "Unmute audio"} onClick={() => onVolumeChange(volume ? 0 : .45)}>{volume ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}</button><input aria-label="Audio volume" className="w-full accent-[var(--accent-primary)]" type="range" min="0" max="1" step=".05" value={volume} onChange={(event) => onVolumeChange(Number(event.target.value))} /></div>}
      </div>
    </section>
  </aside>
}

function PanelTitle({ icon: Icon, children }: { icon: typeof Focus; children: React.ReactNode }) { return <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-muted-foreground"><Icon className="size-4 text-primary" />{children}</h2> }
function DetailRow({ icon: Icon, label, value, action }: { icon: typeof Focus; label: string; value: string; action: React.ReactNode }) { return <div className="flex min-h-24 items-center gap-3 py-4"><span className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-primary"><Icon className="size-5" /></span><div className="flex-1"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">{label}</p><p className="mt-1 font-medium">{value}</p></div>{action}</div> }
function ControlButton({ icon: Icon, label, hint, onClick }: { icon: typeof Play; label: string; hint: string; onClick: () => void }) { return <Button variant="secondary" className="min-h-16 min-w-20 flex-col gap-0 rounded-2xl px-4" onClick={onClick}><Icon className="size-5" /><span>{label}</span><span className="hidden text-[9px] font-normal text-muted-foreground sm:block">{hint}</span></Button> }
