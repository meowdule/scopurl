import type { QualityAxisKey } from "@/lib/qualityProfile";

/** 7축 품질 프로필 한글 라벨 (카드·리포트·분석 파이프라인 공통) */
export const QUALITY_AXIS_LABELS: Record<QualityAxisKey, string> = {
  performance: "성능",
  accessibility: "접근성",
  ux: "사용성",
  seo: "SEO",
  shareability: "공유성",
  security: "보안",
  stability: "안정성",
};

export function axisLabelForKey(key: QualityAxisKey): string {
  return QUALITY_AXIS_LABELS[key];
}

/** card.json에 깨진 placeholder 라벨(?? 등)이 저장된 경우 감지 */
export function isBrokenAxisLabel(label: string | undefined): boolean {
  if (!label || label === "SEO") return false;
  return /^[\?·\s]+$/.test(label) || label.length <= 3 && !/[\uac00-\ud7a3]/.test(label);
}
