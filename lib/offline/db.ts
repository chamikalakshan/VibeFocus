"use client"

import { openDB } from "idb"

export interface QueuedMutation {
  id: string
  ownerId: string
  entity: "task" | "focus_session" | "project" | "goal"
  operation: "create" | "update" | "delete"
  payload: Record<string, unknown>
  clientTimestamp: string
  attempts: number
}

type CacheStore = "tasks" | "focus_sessions" | "projects" | "goals"

const db = () => openDB("vibefocus", 2, {
  upgrade(database) {
    if (!database.objectStoreNames.contains("tasks")) database.createObjectStore("tasks", { keyPath: "id" })
    if (!database.objectStoreNames.contains("focus_sessions")) database.createObjectStore("focus_sessions", { keyPath: "id" })
    if (!database.objectStoreNames.contains("projects")) database.createObjectStore("projects", { keyPath: "id" })
    if (!database.objectStoreNames.contains("goals")) database.createObjectStore("goals", { keyPath: "id" })
    if (!database.objectStoreNames.contains("mutations")) database.createObjectStore("mutations", { keyPath: "id" })
  },
})

export async function cacheRecord(store: CacheStore, ownerId: string, value: Record<string, unknown>) {
  return (await db()).put(store, { ...value, _ownerId: ownerId })
}

export async function getCachedRecords(store: CacheStore, ownerId: string) {
  return (await db()).getAll(store).then((records) => records.filter((record) => record._ownerId === ownerId))
}

export async function queueMutation(mutation: Omit<QueuedMutation, "id" | "clientTimestamp" | "attempts">) {
  return (await db()).put("mutations", { ...mutation, id: crypto.randomUUID(), clientTimestamp: new Date().toISOString(), attempts: 0 })
}

export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  return (await db()).getAll("mutations")
}

export async function removeQueuedMutation(id: string) {
  return (await db()).delete("mutations", id)
}

export function mutationsForOwner(mutations: QueuedMutation[], ownerId: string) {
  return mutations.filter((mutation) => mutation.ownerId === ownerId)
}

export async function syncQueuedMutations(ownerId: string) {
  const mutations = mutationsForOwner(await getQueuedMutations(), ownerId)
  if (!mutations.length) return
  const response = await fetch("/api/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(mutations) })
  if (!response.ok) return
  const { applied } = await response.json() as { applied: string[] }
  await Promise.all(applied.map(removeQueuedMutation))
}
