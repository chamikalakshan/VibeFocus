"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function NotificationControl() {
  const [message, setMessage] = useState("")
  const request = async () => {
    if (!("Notification" in window)) { setMessage("Notifications are not supported in this browser."); return }
    const permission = await Notification.requestPermission()
    setMessage(permission === "granted" ? "Notifications enabled." : "Notification permission was not granted.")
    if (permission === "granted") {
      new Notification("VibeFocus", { body: "Notifications are working." })
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (key && "serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(key) })
        await fetch("/api/push/subscriptions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(subscription) })
      }
    }
  }
  return <div className="space-y-2"><Button type="button" variant="outline" onClick={request}>Enable and test notifications</Button><p role="status" className="text-sm text-muted-foreground">{message}</p></div>
}

function decodeKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4)
  const bytes = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from([...bytes].map((character) => character.charCodeAt(0)))
}
