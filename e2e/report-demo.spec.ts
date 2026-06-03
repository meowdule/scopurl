import { test, expect } from "@playwright/test";

test.describe("fixture report (/demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByRole("heading", { name: "품질 인증 카드" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("shows share card and diagnostic summary", async ({ page }) => {
    const shareCard = page.locator("#report-hero-share-card");
    await expect(shareCard.getByText("Website Health Score").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "진단 요약" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "상세 분석" })).toBeVisible();
  });

  test("shows priority improvements row", async ({ page }) => {
    await expect(page.getByText("주요 개선 포인트")).toBeVisible();
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
