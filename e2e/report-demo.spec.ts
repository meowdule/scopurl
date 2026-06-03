import { test, expect } from "@playwright/test";

test.describe("fixture report (/demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByRole("heading", { name: "품질 인증 카드" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("shows share card and report sections", async ({ page }) => {
    const shareCard = page.locator("#report-hero-share-card");
    await expect(shareCard.getByText("Website Health Score").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "우선 개선 TOP3" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "영역별 진단" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "발견 이슈 상세" })).toBeVisible();
  });

  test("shows analysis overview without duplicate score", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "분석 개요" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "진단 요약" })).toHaveCount(0);
  });

  test("PDF download opens lead modal", async ({ page }) => {
    await page.getByRole("button", { name: "PDF 다운로드" }).click();
    await expect(page.getByText("PDF 리포트 받기")).toBeVisible();
    await page.getByRole("button", { name: "취소" }).click();
  });

  test("share card PNG download button", async ({ page }) => {
    await expect(page.getByLabel("PNG 다운로드")).toBeVisible();
    await expect(page.getByLabel("공유 페이지 주소 복사")).toBeVisible();
  });
});

test.describe("sample report (/report)", () => {
  test("loads share card layout", async ({ page }) => {
    await page.goto("/report");
    await expect(page.getByRole("heading", { name: "품질 인증 카드" })).toBeVisible({
      timeout: 15_000,
    });
    const shareCard = page.locator(".report-screen #report-hero-share-card");
    await expect(shareCard.getByText("SCOPURL").first()).toBeVisible();
  });
});
