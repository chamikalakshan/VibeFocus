import { describe, expect, it } from "vitest"
import { focusAudioPlayerUrl, parseFocusAudioPreference, parseFocusAudioSource, youtubeThumbnailUrl } from "@/lib/domain/audio-source"

describe("parseFocusAudioSource", () => {
  it("normalizes YouTube videos and playlists", () => {
    expect(parseFocusAudioSource("https://youtu.be/abc_123")?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/abc_123")
    expect(parseFocusAudioSource("https://youtube.com/shorts/short_123")?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/short_123")
    expect(parseFocusAudioSource("https://m.youtube.com/watch?v=mobile_123")?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/mobile_123")
    expect(parseFocusAudioSource("https://www.youtube.com/playlist?list=PL_good")?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/videoseries?list=PL_good")
    expect(parseFocusAudioSource("https://www.youtube.com/watch?v=abc_123&list=PL_good")?.embedUrl).toBe("https://www.youtube-nocookie.com/embed/abc_123?list=PL_good")
  })

  it("normalizes supported Spotify sources", () => {
    expect(parseFocusAudioSource("https://open.spotify.com/playlist/abc123")?.embedUrl).toBe("https://open.spotify.com/embed/playlist/abc123")
    expect(parseFocusAudioSource("https://open.spotify.com/show/podcast123")?.label).toBe("Spotify podcast")
  })

  it("rejects unsupported and unsafe links", () => {
    expect(parseFocusAudioSource("http://youtube.com/watch?v=abc")).toBeNull()
    expect(parseFocusAudioSource("https://example.com/music")).toBeNull()
    expect(parseFocusAudioSource("not a link")).toBeNull()
  })

  it("adds player parameters without discarding playlist context", () => {
    const source = parseFocusAudioSource("https://www.youtube.com/watch?v=abc_123&list=PL_good")
    expect(source && focusAudioPlayerUrl(source, true)).toContain("list=PL_good")
    expect(source && focusAudioPlayerUrl(source, true)).toContain("autoplay=1")
  })

  it("builds thumbnails for YouTube videos but not playlist-only sources", () => {
    const video = parseFocusAudioSource("https://youtu.be/abc_123")
    const playlist = parseFocusAudioSource("https://youtube.com/playlist?list=PL_good")
    expect(video && youtubeThumbnailUrl(video)).toBe("https://i.ytimg.com/vi/abc_123/hqdefault.jpg")
    expect(playlist && youtubeThumbnailUrl(playlist)).toBeNull()
  })

  it("restores and clamps saved audio preferences", () => {
    const source = parseFocusAudioSource("https://youtu.be/abc_123")
    expect(parseFocusAudioPreference({ source, volume: 2 })?.volume).toBe(1)
    expect(parseFocusAudioPreference({ source, volume: 0.35 })?.source).toEqual(source)
  })
})
