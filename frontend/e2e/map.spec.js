import { test, expect } from "@playwright/test"

test.describe("Live map", () => {
  test("map loads and shows the legend", async ({ page }) => {
    await page.goto("/map")
    await expect(page.getByText("Status", { exact: true })).toBeVisible({ timeout: 10000 })
  })

  test("zone search finds and selects an area", async ({ page }) => {
    await page.goto("/map")
    await page.getByPlaceholder(/search area/i).fill("G-11")
    await expect(page.getByText("G-11 Sector")).toBeVisible({ timeout: 10000 })
  })

  test("clicking heatmap toggle changes the legend", async ({ page }) => {
    await page.goto("/map")
    await expect(page.getByText("Status", { exact: true })).toBeVisible({ timeout: 10000 })
    const heatmapButton = page.getByTitle(/heatmap/i)
    await heatmapButton.click()
    await expect(page.getByText("Reliability", { exact: true })).toBeVisible()
  })
})