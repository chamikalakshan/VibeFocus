"use client"

import { useEffect, useState } from "react"
import { syncQueuedMutations } from "@/lib/offline/db"
import { supabase } from "@/utils/supabase/client"

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const update = async () => {
      setOnline(navigator.onLine)
      if (navigator.onLine) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) await syncQueuedMutations(user.id)
      }
    }
    const initial = window.setTimeout(() => void update(), 0)
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js")
    }
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
      window.clearTimeout(initial)
    }
  }, [])

  return (
    <>
      {!online && <div role="status" className="fixed inset-x-0 top-0 z-[100] bg-yellow-500 px-3 py-1 text-center text-xs font-medium text-black">Offline: changes will sync when you reconnect.</div>}
      {children}
    </>
  )
}
