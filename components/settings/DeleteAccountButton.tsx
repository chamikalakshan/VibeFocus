"use client"

import { useState } from "react"
import { supabase } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"

export function DeleteAccountButton() {
  const [message, setMessage] = useState("")
  const remove = async () => {
    if (!window.confirm("Permanently delete your VibeFocus account and all associated data? This cannot be undone.")) return
    const { error } = await supabase.functions.invoke("delete-account")
    if (error) { setMessage("Account deletion could not be completed."); return }
    await supabase.auth.signOut()
    window.location.assign("/")
  }
  return <div><Button type="button" variant="destructive" onClick={remove}>Delete account</Button>{message && <p role="alert" className="mt-2 text-sm text-red-500">{message}</p>}</div>
}
