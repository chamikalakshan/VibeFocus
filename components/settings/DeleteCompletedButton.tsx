"use client"

import { useState } from "react"
import { deleteCompletedTasks } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function DeleteCompletedButton() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return <><Button variant="destructive" type="button" onClick={() => setOpen(true)}>Delete completed tasks</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Delete every completed task?</DialogTitle><DialogDescription>This permanently removes completed tasks and their associated history.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={async () => { setBusy(true); await deleteCompletedTasks(); setBusy(false); setOpen(false) }}>{busy ? "Deleting…" : "Delete completed tasks"}</Button></DialogFooter></DialogContent></Dialog></>
}
