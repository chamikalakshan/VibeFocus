import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

describe("client data boundaries", () => {
  it("keeps task-table access out of the client-owned context", () => {
    const source = readFileSync(resolve(process.cwd(), "context/VibeContext.tsx"), "utf8")
    expect(source).not.toContain('.from("tasks")')
    expect(source).not.toContain('.from("task_energy_audits")')
    expect(source).not.toContain("user_id:")
  })

  it("declares explicit RLS policies for every canonical user-owned table", () => {
    const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/202606120002_security_hardening.sql"), "utf8")
    const policyTest = readFileSync(resolve(process.cwd(), "supabase/tests/rls.sql"), "utf8")
    const tables = ["tasks", "projects", "goals", "user_settings", "focus_sessions", "task_energy_audits", "energy_checkins", "user_stats", "push_subscriptions", "processed_mutations", "ai_import_usage"]
    for (const table of tables) {
      expect(migration).toContain(`'${table}'`)
      expect(policyTest).toContain(`public.${table}`)
    }
    expect(migration).toContain("for select to authenticated using (auth.uid() = user_id)")
    expect(migration).toContain("for insert to authenticated with check (auth.uid() = user_id)")
    expect(migration).toContain("for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)")
    expect(migration).toContain("for delete to authenticated using (auth.uid() = user_id)")
  })

  it("keeps the pgTAP plan aligned with complete cross-user coverage", () => {
    const policyTest = readFileSync(resolve(process.cwd(), "supabase/tests/rls.sql"), "utf8")
    const planned = Number(policyTest.match(/select plan\((\d+)\)/)?.[1])
    const assertions = policyTest.match(/select (?:results_eq|throws_like)\(/g)?.length ?? 0
    expect(planned).toBe(assertions)

    const tables = ["tasks", "projects", "goals", "user_settings", "focus_sessions", "task_energy_audits", "energy_checkins", "user_stats", "push_subscriptions", "processed_mutations", "ai_import_usage"]
    for (const table of tables) {
      expect(policyTest, `${table} read isolation`).toContain(`from public.${table}$$`)
      expect(policyTest, `${table} update isolation`).toContain(`update public.${table}`)
      expect(policyTest, `${table} delete isolation`).toContain(`delete from public.${table}`)
    }
  })

  it("does not expose a service-role variable to browser code", () => {
    const client = readFileSync(resolve(process.cwd(), "utils/supabase/client.ts"), "utf8")
    const envExample = readFileSync(resolve(process.cwd(), ".env.example"), "utf8")
    expect(client).not.toContain("SERVICE_ROLE")
    expect(envExample).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE")
  })

  it("requires server authentication in every protected API route", () => {
    const routes = [
      "app/api/tasks/route.ts",
      "app/api/account/export/route.ts",
      "app/api/analytics/summary/route.ts",
      "app/api/schema/capabilities/route.ts",
      "app/api/portfolio/[entity]/route.ts",
      "app/api/push/subscriptions/route.ts",
      "app/api/ai/import/route.ts",
      "app/api/sync/route.ts",
    ]
    for (const route of routes) {
      const source = readFileSync(resolve(process.cwd(), route), "utf8")
      expect(source, route).toContain("auth.getUser()")
      expect(source, route).toContain("Unauthorized")
    }
  })

  it("partitions offline mutations by local account", () => {
    const source = readFileSync(resolve(process.cwd(), "lib/offline/db.ts"), "utf8")
    expect(source).toContain("ownerId: string")
    expect(source).toContain("mutation.ownerId === ownerId")
    expect(source).toContain("record._ownerId === ownerId")
  })
})
