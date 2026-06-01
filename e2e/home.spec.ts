import { test, expect } from "@playwright/test";

test("home shows analyze form", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByPlaceholder("https://example.com")).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyze" })).toBeVisible();
  await expect(page.getByText("1440px")).toBeVisible();
  await expect(page.getByText("390px")).toBeVisible();
});

test("advanced options expand", async ({ page }) => {
  await page.goto("/");
  await page.locator("details summary").click();
  await expect(page.locator('input[type="number"]').first()).toBeVisible();
});
