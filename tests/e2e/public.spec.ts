import { expect, test } from "@playwright/test"

test("landing page and protected-route redirect", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Focus on the work that fits right now." })).toBeVisible()
  await page.goto("/dashboard/settings")
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole("heading", { name: "Return to your focus" })).toBeVisible()
})
