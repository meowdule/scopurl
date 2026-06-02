import { test, expect } from "@playwright/test";

test.describe("fixture report (/demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByRole("heading", { name: "품질 점수" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("shows score dashboard and detail section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "상세 분석" })).toBeVisible();
    await expect(
      page.getByText("https://example.com", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("성능 · 페이지 로딩")).toBeVisible();
  });

  test("gated sections show solution CTA", async ({ page }) => {
    await expect(page.getByText("주요 이용 흐름")).toBeVisible();
    await expect(page.getByRole("button", { name: "솔루션 문의" }).first()).toBeVisible();
  });

  test("PDF download opens lead modal", async ({ page }) => {
    await page.getByRole("button", { name: "PDF 다운로드" }).click();
    await expect(page.getByText("PDF 리포트 받기")).toBeVisible();
    await page.getByRole("button", { name: "취소" }).click();
  });

  test("score card share icon actions", async ({ page }) => {
    await expect(page.getByLabel("PNG 다운로드")).toBeVisible();
    await expect(page.getByLabel("공유 페이지 주소 복사")).toBeVisible();
  });

  test("extended report CTA", async ({ page }) => {
    await expect(page.getByText("확장 분석 요청")).toBeVisible();
  });
});

test.describe("sample report (/report)", () => {
  test("loads example report without redirect", async ({ page }) => {
    await page.goto("/report");
    await expect(page.getByRole("heading", { name: "품질 점수" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: "상세 분석" })).toBeVisible();
    await expect(page.getByText("분석에 시간이 쓰인 부분")).toBeVisible();
  });
});
