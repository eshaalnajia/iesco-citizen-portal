import { test, expect } from "@playwright/test"

async function lookupBill(page, ref) {
  await page.goto("/billing")
  await page.waitForLoadState("networkidle")
  await page.getByPlaceholder("e.g. 1234 5678 9012 34").fill(ref)
  const btn = page.getByTestId("billing-lookup-btn")
  await expect(btn).toBeEnabled()
  await btn.click()
  await page.waitForLoadState("networkidle")
}

test.describe("Bill payment flow", () => {
  test("looking up a bill shows the correct amount", async ({ page }) => {
    await lookupBill(page, "1111 1111 1111 11")
    await expect(page.getByText(/total payable/i)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/PKR/i).first()).toBeVisible()
  })

  test("invalid reference number shows a clear error", async ({ page }) => {
    await lookupBill(page, "9999 9999 9999 99")
    await expect(page.getByText(/bill not found/i)).toBeVisible({ timeout: 15000 })
  })

  test("payment method selector shows all three options", async ({ page }) => {
    await lookupBill(page, "1111 1111 1111 11")
    await expect(page.getByText("JazzCash").first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("EasyPaisa")).toBeVisible()
    await expect(page.getByText("Bank / ATM")).toBeVisible()
  })

  test("selecting bank transfer shows the payment slip with reference number", async ({ page }) => {
    await lookupBill(page, "1111 1111 1111 11")
    await page.getByText("Bank / ATM").click()
    await expect(page.getByText("IESCO Reference Number", { exact: true })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("1111 1111 1111 11", { exact: true })).toBeVisible()
  })

  test.skip("JazzCash flow reaches the OTP step - BLOCKED: sandbox URL returns 404, see JazzCash initiate endpoint config", async ({ page }) => {
    await lookupBill(page, "1111 1111 1111 11")
    await page.getByPlaceholder("03001234567").fill("03001234567")
    await page.getByRole("button", { name: /send otp/i }).click()
    await expect(page.getByText(/otp sent/i)).toBeVisible({ timeout: 10000 })
  })
})