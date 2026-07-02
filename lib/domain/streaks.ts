export interface StreakResult {
  current: number
  longest: number
}

function dayKey(value: string | Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value))
}

function previousDay(key: string) {
  const date = new Date(`${key}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

export function calculateStreak(completedDates: Array<string | Date>, timezone: string, now = new Date()): StreakResult {
  const days = [...new Set(completedDates.map((date) => dayKey(date, timezone)))].sort()
  let longest = 0
  let run = 0
  let prior: string | undefined
  for (const day of days) {
    run = prior && previousDay(day) === prior ? run + 1 : 1
    longest = Math.max(longest, run)
    prior = day
  }

  const today = dayKey(now, timezone)
  const yesterday = previousDay(today)
  const latest = days.at(-1)
  if (latest !== today && latest !== yesterday) return { current: 0, longest }

  let current = 0
  let cursor = latest
  while (cursor && days.includes(cursor)) {
    current += 1
    cursor = previousDay(cursor)
  }
  return { current, longest }
}
