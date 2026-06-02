import { test, expect } from "@playwright/test";

test.describe("fixture report (/demo)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByRole("heading", { name: "품질 프로필" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("shows quality dashboard and detail section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "상세 분석" })).toBeVisible();
    await expect(page.getByText("scopurl 품질 리포트")).toBeVisible();
    await expect(page.getByRole("heading", { name: "영역별 진단" })).toBeVisible();
    await expect(page.getByText("성능", { exact: true }).first()).toBeVisible();
  });

  test("shows priority improvements", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "우선 개선 항목" })).toBeVisible();
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
    await expect(page.getByText("더 자세한 결과가 필요하신가요?")).toBeVisible();
    await expect(page.getByRole("button", { name: "확장 분석 요청" })).toBeVisible();
  });
});

test.describe("sample report (/report)", () => {
  test("loads example report without redirect", async ({ page }) => {
    await page.goto("/report");
    await expect(page.getByRole("heading", { name: "품질 프로필" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: "상세 분석" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "분석 과정" })).toBeVisible();
  });
});
