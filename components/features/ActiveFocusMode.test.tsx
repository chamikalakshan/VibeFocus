import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ActiveFocusMode } from "@/components/features/ActiveFocusMode"

let activeTaskId: string | null = null
const setActiveTaskId = vi.fn((id: string | null) => { activeTaskId = id })
const getActiveFocusSession = vi.fn()

vi.mock("@/context/VibeContext", () => ({
  useVibe: () => ({
    activeTaskId,
    setActiveTaskId,
    tasks: [{ id: "task-123" }],
    user: { id: "user-123" },
  }),
}))

vi.mock("@/actions/focus", () => ({
  getActiveFocusSession: () => getActiveFocusSession(),
}))

vi.mock("@/components/features/FocusMode", () => ({
  FocusMode: ({ taskId, restoredSession }: { taskId: string; restoredSession?: { id: string } | null }) => <div>Focus session for {taskId}{restoredSession ? ` restored ${restoredSession.id}` : ""}</div>,
}))

describe("ActiveFocusMode", () => {
  beforeEach(() => {
    activeTaskId = null
    setActiveTaskId.mockClear()
    getActiveFocusSession.mockReset().mockResolvedValue(null)
  })

  it("mounts the focus experience when a task is selected", () => {
    const { rerender } = render(<ActiveFocusMode />)
    expect(screen.queryByText(/Focus session/)).not.toBeInTheDocument()

    activeTaskId = "task-123"
    rerender(<ActiveFocusMode />)

    expect(screen.getByText("Focus session for task-123")).toBeInTheDocument()
  })

  it("restores the latest active server session", async () => {
    getActiveFocusSession.mockResolvedValue({
      id: "session-123",
      taskId: "task-123",
      plannedSeconds: 1500,
      remainingSeconds: 900,
      status: "running",
      endsAt: "2026-06-13T12:00:00.000Z",
      updatedAt: "2026-06-13T11:45:00.000Z",
    })

    const { rerender } = render(<ActiveFocusMode />)
    await waitFor(() => expect(setActiveTaskId).toHaveBeenCalledWith("task-123"))
    rerender(<ActiveFocusMode />)

    expect(screen.getByText("Focus session for task-123 restored session-123")).toBeInTheDocument()
  })
})
