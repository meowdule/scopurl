import { test, expect } from "@playwright/test";

test.describe("fixture report (/demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByText("종합 점수")).toBeVisible({ timeout: 15_000 });
  });

  test("shows executive summary and categories", async ({ page }) => {
    await expect(page.getByText("카테고리별 점수")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "https://example.com" }),
    ).toBeVisible();
  });

  test("gated sections show solution CTA", async ({ page }) => {
    await expect(page.getByText("주요 흐름")).toBeVisible();
    await expect(page.getByRole("button", { name: "솔루션 문의" }).first()).toBeVisible();
  });

  test("PDF download opens lead modal", async ({ page }) => {
    await page.getByRole("button", { name: "PDF 다운로드" }).click();
    await expect(page.getByText("PDF 리포트 받기")).toBeVisible();
    await page.getByRole("button", { name: "취소" }).click();
  });

  test("score card share section", async ({ page }) => {
    await expect(page.getByText("점수 카드 공유")).toBeVisible();
    await expect(page.getByRole("button", { name: "PNG 다운로드" })).toBeVisible();
  });

  test("extended report CTA", async ({ page }) => {
    await expect(page.getByText("확장 분석 요청")).toBeVisible();
  });
});
