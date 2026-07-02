import { describe, expect, it } from "vitest"
import { mutationsForOwner, type QueuedMutation } from "./db"

const mutation = (id: string, ownerId: string): QueuedMutation => ({
  id,
  ownerId,
  entity: "task",
  operation: "update",
  payload: { id },
  clientTimestamp: "2026-06-12T00:00:00.000Z",
  attempts: 0,
})

describe("offline privacy boundary", () => {
  it("syncs only mutations belonging to the current local account", () => {
    const queued = [mutation("10000000-0000-0000-0000-000000000001", "user-a"), mutation("20000000-0000-0000-0000-000000000002", "user-b")]
    expect(mutationsForOwner(queued, "user-a").map((item) => item.ownerId)).toEqual(["user-a"])
  })

  it("does not sync legacy unowned mutations under a new account", () => {
    const legacy = { ...mutation("10000000-0000-0000-0000-000000000001", "user-a"), ownerId: undefined } as unknown as QueuedMutation
    expect(mutationsForOwner([legacy], "user-b")).toEqual([])
  })
})
