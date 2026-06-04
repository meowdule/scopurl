import type { QualityAxisKey } from "@/lib/qualityProfile";

/** PDF 전용 — URL 화면 axis tint와 동일 계열 */
export const PDF_AXIS_TINT: Record<
  QualityAxisKey,
  { bg: string; border: string; accent: string }
> = {
  performance: { bg: "#f0fdf4", border: "#bbf7d0", accent: "#16a34a" },
  accessibility: { bg: "#eff6ff", border: "#bfdbfe", accent: "#2563eb" },
  ux: { bg: "#f5f3ff", border: "#ddd6fe", accent: "#7c3aed" },
  seo: { bg: "#fffbeb", border: "#fde68a", accent: "#d97706" },
  shareability: { bg: "#ecfeff", border: "#a5f3fc", accent: "#0891b2" },
  security: { bg: "#f8fafc", border: "#e2e8f0", accent: "#475569" },
  stability: { bg: "#fdf2f8", border: "#fbcfe8", accent: "#db2777" },
};

export const PDF_PRIORITY_ACCENT: Record<
  QualityAxisKey,
  { bar: string; bg: string }
> = {
  seo: { bar: "#d97706", bg: "#fffbeb" },
  shareability: { bar: "#2563eb", bg: "#eff6ff" },
  ux: { bar: "#16a34a", bg: "#f0fdf4" },
  performance: { bar: "#00a66a", bg: "#eafbf3" },
  accessibility: { bar: "#2563eb", bg: "#eff6ff" },
  security: { bar: "#475569", bg: "#f8fafc" },
  stability: { bar: "#db2777", bg: "#fdf2f8" },
};

export const SEO_WHY_IMPORTANT: Record<string, string> = {
  title: "검색 결과의 첫인상이며 클릭률에 직접 영향을 줍니다.",
  meta: "검색 스니펫 품질과 사용자의 방문 결정에 영향을 줍니다.",
  og: "SNS·메신저 공유 시 브랜드 인상과 클릭 전환에 중요합니다.",
  canonical: "중복 URL을 통합해 검색 엔진이 올바른 페이지를 인식하게 합니다.",
  robots: "색인 범위를 제어해 노출·비노출 전략을 실행할 수 있습니다.",
  structured: "리치 결과와 검색 엔진의 콘텐츠 이해를 돕습니다.",
};
