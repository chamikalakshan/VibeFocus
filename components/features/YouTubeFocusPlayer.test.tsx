import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { YouTubeFocusPlayer } from "@/components/features/YouTubeFocusPlayer"

const playVideo = vi.fn()
const pauseVideo = vi.fn()
const setVolume = vi.fn()
let playerState = 2

describe("YouTubeFocusPlayer", () => {
  beforeEach(() => {
    playVideo.mockReset()
    pauseVideo.mockReset()
    setVolume.mockReset()
    playerState = 2
    window.YT = {
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
      Player: class {
        constructor(_element: HTMLElement, options: { events: { onReady: (event: { target: object }) => void } }) {
          options.events.onReady({
            target: {
              playVideo,
              pauseVideo,
              mute: vi.fn(),
              unMute: vi.fn(),
              isMuted: () => false,
              setVolume,
              getVolume: () => 55,
              getPlayerState: () => playerState,
              destroy: vi.fn(),
            },
          })
        }
      } as never,
    }
  })

  it("controls the live YouTube player state", async () => {
    render(<YouTubeFocusPlayer source={{ kind: "youtube", label: "YouTube audio", url: "https://youtu.be/abc123", embedUrl: "https://www.youtube-nocookie.com/embed/abc123" }} />)
    const button = await screen.findByRole("button", { name: "Play YouTube" })
    await waitFor(() => expect(button).toBeEnabled())

    fireEvent.click(button)
    expect(playVideo).toHaveBeenCalledOnce()

    playerState = 1
    fireEvent.click(button)
    expect(pauseVideo).toHaveBeenCalledOnce()
  })
})
