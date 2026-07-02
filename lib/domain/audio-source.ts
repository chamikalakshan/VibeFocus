export type CustomFocusAudioSource =
  | { kind: "youtube"; label: string; url: string; embedUrl: string }
  | { kind: "spotify"; label: string; url: string; embedUrl: string }

export type FocusAudioSource = { kind: "builtin"; label: "VibeFocus Lo-Fi" } | CustomFocusAudioSource
export type FocusAudioPreference = { version: 1; source: FocusAudioSource; volume: number }

export const builtinAudioSource: FocusAudioSource = { kind: "builtin", label: "VibeFocus Lo-Fi" }

export function parseFocusAudioSource(value: string): CustomFocusAudioSource | null {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }
  if (url.protocol !== "https:") return null

  const host = url.hostname.replace(/^(?:www|m)\./, "")
  if (host === "youtu.be") {
    const videoId = cleanId(url.pathname.split("/")[1])
    return videoId ? youtubeSource(url, `https://www.youtube-nocookie.com/embed/${videoId}`) : null
  }
  if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    const listId = cleanId(url.searchParams.get("list"))
    const videoId = cleanId(url.searchParams.get("v"))
      ?? cleanId(url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1])
    if (videoId) return youtubeSource(url, `https://www.youtube-nocookie.com/embed/${videoId}${listId ? `?list=${listId}` : ""}`)
    if (listId) return youtubeSource(url, `https://www.youtube-nocookie.com/embed/videoseries?list=${listId}`)
  }
  if (host === "open.spotify.com") {
    const [type, id] = url.pathname.split("/").filter(Boolean)
    if (["track", "playlist", "album", "episode", "show"].includes(type) && cleanId(id)) {
      return {
        kind: "spotify",
        label: `Spotify ${type === "show" ? "podcast" : type}`,
        url: url.toString(),
        embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
      }
    }
  }
  return null
}

export function focusAudioPlayerUrl(source: CustomFocusAudioSource, autoplay: boolean): string {
  if (source.kind !== "youtube") return source.embedUrl
  const url = new URL(source.embedUrl)
  url.searchParams.set("playsinline", "1")
  url.searchParams.set("rel", "0")
  if (autoplay) url.searchParams.set("autoplay", "1")
  return url.toString()
}

export function youtubeThumbnailUrl(source: CustomFocusAudioSource): string | null {
  if (source.kind !== "youtube") return null
  const videoId = new URL(source.embedUrl).pathname.match(/^\/embed\/([^/]+)$/)?.[1]
  return videoId && videoId !== "videoseries" ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null
}

export function isFocusAudioSource(value: unknown): value is FocusAudioSource {
  if (!value || typeof value !== "object" || !("kind" in value)) return false
  if (value.kind === "builtin") return "label" in value && value.label === "VibeFocus Lo-Fi"
  if (!("url" in value) || typeof value.url !== "string" || !("embedUrl" in value) || typeof value.embedUrl !== "string") return false
  const parsed = parseFocusAudioSource(value.url)
  return Boolean(parsed && parsed.kind === value.kind && parsed.embedUrl === value.embedUrl)
}

export function parseFocusAudioPreference(value: unknown): FocusAudioPreference | null {
  if (!value || typeof value !== "object" || !("source" in value) || !isFocusAudioSource(value.source)) return null
  const volume = "volume" in value && typeof value.volume === "number" ? value.volume : 0.45
  return { version: 1, source: value.source, volume: Math.max(0, Math.min(1, volume)) }
}

function cleanId(value: string | null | undefined) {
  return value && /^[a-zA-Z0-9_-]+$/.test(value) ? value : null
}

function youtubeSource(url: URL, embedUrl: string): CustomFocusAudioSource {
  return { kind: "youtube", label: "YouTube audio", url: url.toString(), embedUrl }
}
