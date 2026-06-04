import { test, expect } from "@playwright/test";

test("score card page loads fixture", async ({ page }) => {
  await page.goto("/card/e2e-card");
  await expect(page.getByText("SCOPURL").first()).toBeVisible();
  await expect(page.getByText("Website Health Score")).toBeVisible();
  await expect(page.getByText("82")).toBeVisible();
});
