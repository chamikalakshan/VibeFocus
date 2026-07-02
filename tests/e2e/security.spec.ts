import { expect, test } from "@playwright/test"

const protectedApis = [
  "/api/tasks",
  "/api/account/export",
  "/api/analytics/summary",
  "/api/schema/capabilities",
  "/api/portfolio/projects",
]

test("protected APIs reject anonymous requests", async ({ request }) => {
  for (const path of protectedApis) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(401)
  }

  const mutations: Array<{ method: "post" | "patch" | "delete"; path: string }> = [
    { method: "post", path: "/api/tasks" },
    { method: "patch", path: "/api/tasks" },
    { method: "delete", path: "/api/tasks?id=10000000-0000-0000-0000-000000000001" },
    { method: "post", path: "/api/ai/import" },
    { method: "post", path: "/api/push/subscriptions" },
    { method: "post", path: "/api/sync" },
    { method: "post", path: "/api/portfolio/projects" },
    { method: "patch", path: "/api/portfolio/projects" },
  ]
  for (const mutation of mutations) {
    const response = await request[mutation.method](mutation.path, { data: {} })
    expect(response.status(), `${mutation.method.toUpperCase()} ${mutation.path}`).toBe(401)
  }
})

test("dashboard routes are protected server-side", async ({ page }) => {
  await page.goto("/dashboard/today")
  await expect(page).toHaveURL(/\/login$/)
})
