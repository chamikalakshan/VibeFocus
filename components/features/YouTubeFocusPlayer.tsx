"use client"

import { useEffect, useRef, useState } from "react"
import { ExternalLink, Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from "lucide-react"
import type { CustomFocusAudioSource } from "@/lib/domain/audio-source"
import { Button } from "@/components/ui/button"

type YouTubePlayer = {
  playVideo: () => void
  pauseVideo: () => void
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  setVolume: (volume: number) => void
  getVolume: () => number
  getPlayerState: () => number
  destroy: () => void
}

type YouTubePlayerConstructor = new (element: HTMLElement, options: {
  videoId?: string
  playerVars: Record<string, string | number>
  events: {
    onReady: (event: { target: YouTubePlayer }) => void
    onStateChange: (event: { data: number }) => void
    onError: () => void
  }
}) => YouTubePlayer

declare global {
  interface Window {
    YT?: {
      Player: YouTubePlayerConstructor
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApiPromise: Promise<void> | null = null

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve()
  if (youtubeApiPromise) return youtubeApiPromise
  youtubeApiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve() }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script")
      script.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(script)
    }
  })
  return youtubeApiPromise
}

export function YouTubeFocusPlayer({ source }: { source: Extract<CustomFocusAudioSource, { kind: "youtube" }> }) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const initialVolumeRef = useRef(55)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(55)
  const [expanded, setExpanded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    void loadYouTubeApi().then(() => {
      if (cancelled || !window.YT?.Player || !mountRef.current) return
      const embed = new URL(source.embedUrl)
      const videoId = embed.pathname.match(/^\/embed\/([^/]+)$/)?.[1]
      const list = embed.searchParams.get("list")
      try {
        new window.YT.Player(mountRef.current, {
          videoId: videoId === "videoseries" ? undefined : videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
            ...(list ? { list, listType: "playlist" } : {}),
          },
          events: {
            onReady: ({ target }) => { if (cancelled) return; playerRef.current = target; target.setVolume(initialVolumeRef.current); setReady(true) },
            onStateChange: ({ data }) => { if (!cancelled) setPlaying(data === window.YT?.PlayerState.PLAYING) },
            onError: () => { if (!cancelled) setFailed(true) },
          },
        })
      } catch {
        setFailed(true)
      }
    }).catch(() => setFailed(true))
    return () => { cancelled = true; playerRef.current?.destroy(); playerRef.current = null }
  }, [source.embedUrl])

  const togglePlayback = () => {
    if (!playerRef.current) return
    const currentlyPlaying = playerRef.current.getPlayerState() === window.YT?.PlayerState.PLAYING
    if (currentlyPlaying) playerRef.current.pauseVideo()
    else playerRef.current.playVideo()
  }
  const toggleMute = () => {
    if (!playerRef.current) return
    if (playerRef.current.isMuted()) { playerRef.current.unMute(); setMuted(false) }
    else { playerRef.current.mute(); setMuted(true) }
  }
  const collapse = () => {
    playerRef.current?.pauseVideo()
    setExpanded((value) => !value)
  }

  return <div className="space-y-3">
    <div ref={mountRef} className={expanded ? "h-[200px] w-full overflow-hidden rounded-xl" : "mx-auto size-[200px] overflow-hidden rounded-xl"} />
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button size="icon-sm" variant="secondary" aria-label={playing ? "Pause YouTube" : "Play YouTube"} disabled={!ready} onClick={togglePlayback}>{playing ? <Pause /> : <Play className="fill-current" />}</Button>
      <Button size="icon-sm" variant="ghost" aria-label={muted ? "Unmute YouTube" : "Mute YouTube"} disabled={!ready} onClick={toggleMute}>{muted ? <VolumeX /> : <Volume2 />}</Button>
      <input aria-label="YouTube volume" className="w-24 accent-[var(--accent-primary)]" type="range" min="0" max="100" value={volume} disabled={!ready} onChange={(event) => { const value = Number(event.target.value); setVolume(value); playerRef.current?.setVolume(value) }} />
      <Button size="icon-sm" variant="ghost" aria-label={expanded ? "Use compact YouTube player" : "Expand YouTube player"} onClick={collapse}>{expanded ? <Minimize2 /> : <Maximize2 />}</Button>
      <Button asChild size="icon-sm" variant="ghost"><a href={source.url} target="_blank" rel="noreferrer" aria-label="Open in YouTube"><ExternalLink /></a></Button>
    </div>
    <p role={failed ? "alert" : undefined} className={failed ? "text-center text-[10px] leading-4 text-[var(--danger)]" : "text-center text-[10px] leading-4 text-muted-foreground"}>{failed ? "The YouTube player could not initialize. Open the source in YouTube or try another embeddable video." : "YouTube may require one play click before browser-controlled playback is allowed."}</p>
  </div>
}
