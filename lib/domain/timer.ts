export interface TimerState {
  status: "running" | "paused" | "completed" | "cancelled"
  endsAt: string | null
  remainingSeconds: number
}

export function remainingSeconds(state: TimerState, now = Date.now()) {
  if (state.status !== "running" || !state.endsAt) return Math.max(0, state.remainingSeconds)
  return Math.max(0, Math.ceil((new Date(state.endsAt).getTime() - now) / 1000))
}

export function resumeTimer(state: TimerState, now = Date.now()): TimerState {
  const seconds = remainingSeconds(state, now)
  return { status: "running", remainingSeconds: seconds, endsAt: new Date(now + seconds * 1000).toISOString() }
}

export function pauseTimer(state: TimerState, now = Date.now()): TimerState {
  return { status: "paused", remainingSeconds: remainingSeconds(state, now), endsAt: null }
}
