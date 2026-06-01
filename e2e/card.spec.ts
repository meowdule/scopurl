import { test, expect } from "@playwright/test";

test("score card page loads fixture", async ({ page }) => {
  await page.goto("/card/e2e-card");
  await expect(
    page.getByText("scopurl", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("주요 개선 포인트")).toBeVisible();
  await expect(page.getByText("접근성 라벨을 보강하면 좋습니다")).toBeVisible();
  await expect(page.getByText("https://example.com")).toHaveCount(0);
});
