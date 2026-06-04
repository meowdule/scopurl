import type { QualityAxisKey } from "@/lib/qualityProfile";

export type ImprovementHintItem = {
  label: string;
  key?: QualityAxisKey;
  expectedGain: number;
};

const PRIORITY_SHORT: Record<QualityAxisKey, string> = {
  performance: "로딩·리소스 최적화 권장",
  accessibility: "접근성 기준 보완 권장",
  ux: "화면·조작 흐름 점검 권장",
  seo: "검색 노출 최적화 권장",
  shareability: "SNS·공유 미리보기 보완 권장",
  security: "보안 연결·설정 점검 권장",
  stability: "연결·오류 안정성 개선 권장",
};

export function priorityShortLine(key: QualityAxisKey): string {
  return PRIORITY_SHORT[key];
}

/** TOP3 기반 공유 카드·요약 문구 */
export function buildImprovementSummary(
  items: ImprovementHintItem[],
  healthScore: number,
): string | null {
  if (items.length === 0) return null;

  const gain = items.reduce((s, p) => s + p.expectedGain, 0);
  const projected = Math.min(100, healthScore + gain);
  const names = items.map((p) => p.label).join(" · ");

  const seoOrShare = items.some(
    (p) => p.key === "seo" || p.key === "shareability",
  );

  if (seoOrShare && projected >= 88) {
    return `검색 노출 및 공유 설정을 개선하면 ${projected}점 이상 달성이 가능합니다.`;
  }

  return `${names} 영역을 개선하면 최대 +${gain}점 향상이 가능합니다.`;
}
