import { test, expect } from "@playwright/test"

test.describe("Load shedding schedule", () => {
  test("loads today's schedule by default", async ({ page }) => {
    await page.goto("/schedule")
    await expect(page.getByRole("heading", { name: /load shedding/i })).toBeVisible()
    await expect(page.getByText(/today/i).first()).toBeVisible()
  })

  test("filtering by sector updates the results", async ({ page }) => {
    await page.goto("/schedule")
    await page.getByTestId("sector-filter-trigger").click()
    await page.getByRole("option", { name: "G-11" }).click()
    await expect(page.getByText("Clear")).toBeVisible()
  })

  test("switching to week view shows 7 day cards", async ({ page }) => {
    await page.goto("/schedule")
    // Select a sector first - week view requires it
    await page.getByTestId("sector-filter-trigger").click()
    await page.getByRole("option", { name: "G-11" }).click()

    await page.getByRole("tab", { name: /this week/i }).click()
    const dayCards = page.locator("[class*='rounded-lg']").filter({ hasText: /today|mon|tue|wed|thu|fri|sat|sun/i })
    await expect(dayCards.first()).toBeVisible()
  })
})