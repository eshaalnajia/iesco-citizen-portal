import { test, expect, devices } from "@playwright/test"

test.use({ ...devices["Pixel 7"] })

test.describe("Mobile experience", () => {
  test("navbar shows hamburger menu on mobile", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("mobile-menu-trigger")).toBeVisible()
  })

  test("schedule page shows card layout, not table, on mobile", async ({ page }) => {
    await page.goto("/schedule")
    const table = page.locator("table")
    await expect(table).not.toBeVisible()
  })

  test("self-service form is usable on mobile", async ({ page }) => {
    await page.goto("/self-service")
    await expect(page.getByText("New Connection").first()).toBeVisible()
    const nameInput = page.getByPlaceholder("As on your CNIC")
    await expect(nameInput).toBeVisible()
  })
})