"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"
import { useVibe } from "@/context/VibeContext"
import { FocusMode } from "@/components/features/FocusMode"
import { getActiveFocusSession, type RestoredFocusSession } from "@/actions/focus"

export function ActiveFocusMode() {
  const { activeTaskId, setActiveTaskId, tasks, user } = useVibe()
  const [restoredSession, setRestoredSession] = useState<RestoredFocusSession | null>(null)
  const attemptedRestore = useRef(false)
  const restoredSessionWasOpened = useRef(false)

  useEffect(() => {
    if (!user || activeTaskId || !tasks.length || attemptedRestore.current) return
    attemptedRestore.current = true
    let cancelled = false
    getActiveFocusSession().then((session) => {
      if (cancelled || !session || !tasks.some((task) => task.id === session.taskId)) return
      setRestoredSession(session)
      setActiveTaskId(session.taskId)
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [activeTaskId, setActiveTaskId, tasks, user])

  useEffect(() => {
    if (activeTaskId && restoredSession?.taskId === activeTaskId) restoredSessionWasOpened.current = true
    if (restoredSessionWasOpened.current && !activeTaskId) Promise.resolve().then(() => setRestoredSession(null))
  }, [activeTaskId, restoredSession])

  return (
    <AnimatePresence>
      {activeTaskId ? <FocusMode key={activeTaskId} taskId={activeTaskId} restoredSession={restoredSession?.taskId === activeTaskId ? restoredSession : null} /> : null}
    </AnimatePresence>
  )
}
