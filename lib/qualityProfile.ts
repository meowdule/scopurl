import type { ReportJson } from "@/lib/types";

export type QualityAxisKey =
  | "performance"
  | "accessibility"
  | "ux"
  | "seo"
  | "shareability"
  | "security"
  | "stability";

export type ScoreTier = "excellent" | "good" | "needs-work" | "critical";

export type QualityAxis = {
  key: QualityAxisKey;
  label: string;
  score: number;
  tier: ScoreTier;
  tierLabel: string;
  summary: string;
  detailBullets: string[];
};

export type PriorityImprovement = {
  axis: QualityAxis;
  urgency: "high" | "medium";
  actions: string[];
  expectedGain: number;
};

export type ReportKpi = {
  pageCount: number;
  linkCount: number;
  issueCount: number;
  analysisSeconds: number | null;
  checkItemCount: number;
};

export function scoreTier(score: number): { tier: ScoreTier; tierLabel: string } {
  if (score >= 90) return { tier: "excellent", tierLabel: "우수" };
  if (score >= 75) return { tier: "good", tierLabel: "양호" };
  if (score >= 60) return { tier: "needs-work", tierLabel: "개선 필요" };
  return { tier: "critical", tierLabel: "시급" };
}

function num(v: number | null | undefined, fallback: number): number {
  return typeof v === "number" ? v : fallback;
}

function deriveShareability(report: ReportJson, seo: number | null): number {
  const hasLhSeo = report.pages.some(
    (p) => typeof p.lighthouse?.seo === "number",
  );
  if (seo != null) {
    return Math.min(100, Math.max(0, Math.round(seo + (hasLhSeo ? 2 : -4))));
  }
  return hasLhSeo ? 72 : 68;
}

function deriveSecurity(report: ReportJson): number {
  const { quick } = report;
  let score = 100;
  if (!quick.sslOk) score -= 40;
  if (!quick.httpOk) score -= 30;
  if (quick.httpStatus != null && quick.httpStatus >= 400) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function deriveStability(report: ReportJson): number {
  const { quick, summary, brokenLinks } = report;
  let score = 100;
  if (!quick.dnsOk) score -= 20;
  if (!quick.httpOk) score -= 20;
  if (summary.totalConsoleErrors > 0) {
    score -= Math.min(15, summary.totalConsoleErrors * 3);
  }
  if (summary.totalFailedRequests > 0) {
    score -= Math.min(15, summary.totalFailedRequests * 2);
  }
  if (brokenLinks.length > 0) {
    score -= Math.min(10, brokenLinks.length * 2);
  }
  return Math.max(0, Math.min(100, score));
}

function performanceBullets(report: ReportJson, score: number): string[] {
  const bullets: string[] = [];
  const avg = report.summary.avgLighthousePerformance;
  if (avg != null) bullets.push(`평균 성능 점수 ${avg}점`);
  const fallback = report.pages.filter((p) => p.lighthouse?.fallback).length;
  if (fallback > 0) {
    bullets.push(`${fallback}개 페이지는 로딩 시간 기준으로 추정했습니다`);
  } else if (score >= 75) {
    bullets.push("페이지 로딩 상태 양호");
  }
  if (score < 80) bullets.push("이미지·스크립트 최적화 여지 발견");
  return bullets.slice(0, 3);
}

function accessibilityBullets(report: ReportJson, score: number): string[] {
  const bullets: string[] = [];
  bullets.push(`접근성 점수 ${score}점`);
  const axeTotal = report.pages.reduce(
    (s, p) => s + (p.axeViolations || []).reduce((n, v) => n + v.nodes, 0),
    0,
  );
  if (axeTotal > 0) bullets.push(`접근성 검사 이슈 ${axeTotal}건 발견`);
  else bullets.push("접근성 검사 이슈 없음");
  if (score < 90) bullets.push("일부 라벨·구조 보완 권장");
  return bullets.slice(0, 3);
}

function uxBullets(report: ReportJson, score: number): string[] {
  const uiCount = report.pages.reduce(
    (s, p) =>
      s + (p.uiIssues?.filter((i) => i.severity !== "info").length ?? 0),
    0,
  );
  const bullets = [`사용성 점수 ${score}점`];
  if (uiCount > 0) bullets.push(`화면·레이아웃 이슈 ${uiCount}건`);
  else bullets.push("버튼·화면 배치 양호");
  if (report.summary.mobileWarnings.length > 0) {
    bullets.push(report.summary.mobileWarnings[0]);
  }
  return bullets.slice(0, 3);
}

function seoBullets(score: number): string[] {
  const bullets = [`SEO 점수 ${score}점`];
  if (score < 80) {
    bullets.push("메타 정보·제목 구조 개선 가능");
    bullets.push("검색 노출을 위한 기본 설정 점검 권장");
  } else {
    bullets.push("검색 최적화 기본 설정 양호");
  }
  return bullets.slice(0, 3);
}

function shareabilityBullets(score: number): string[] {
  const bullets = [`공유성 점수 ${score}점`];
  if (score < 80) {
    bullets.push("Open Graph·SNS 미리보기 정보 보완 가능");
    bullets.push("링크 공유 시 미리보기 품질 개선 여지");
  } else {
    bullets.push("SNS·메신저 공유 미리보기 양호");
  }
  return bullets.slice(0, 3);
}

function securityBullets(report: ReportJson, score: number): string[] {
  const bullets: string[] = [];
  if (report.quick.sslOk) bullets.push("HTTPS 정상 적용");
  else bullets.push("HTTPS 미적용 — 보안 연결 필요");
  if (report.quick.httpOk) bullets.push("연결 상태 정상");
  else bullets.push("웹 접속 상태 확인 필요");
  if (score >= 90) bullets.push("기본 보안 설정 양호");
  return bullets.slice(0, 3);
}

function stabilityBullets(report: ReportJson, score: number): string[] {
  const bullets: string[] = [];
  if (report.summary.totalConsoleErrors === 0) bullets.push("스크립트 오류 없음");
  else bullets.push(`스크립트 오류 ${report.summary.totalConsoleErrors}건`);
  if (report.summary.totalFailedRequests === 0) bullets.push("리소스 로딩 실패 없음");
  else bullets.push(`로딩 실패 ${report.summary.totalFailedRequests}건`);
  if (score >= 85 && report.brokenLinks.length === 0) {
    bullets.push("연결·응답 안정적");
  }
  return bullets.slice(0, 3);
}

export function buildQualityProfile(report: ReportJson): QualityAxis[] {
  const cats = report.summary.categoryScores;
  const perf = num(cats?.performance ?? report.summary.avgLighthousePerformance, 70);
  const a11y = num(cats?.accessibility, 75);
  const ux = num(cats?.ux, 80);
  const seo = cats?.seo ?? null;
  const seoScore = num(seo, 72);
  const share = deriveShareability(report, seo);
  const security = deriveSecurity(report);
  const stability = deriveStability(report);

  const axes: Omit<QualityAxis, "tier" | "tierLabel">[] = [
    {
      key: "performance",
      label: "성능",
      score: perf,
      summary: "페이지 로딩·반응 속도",
      detailBullets: performanceBullets(report, perf),
    },
    {
      key: "accessibility",
      label: "접근성",
      score: a11y,
      summary: "모든 사용자가 이용하기 쉬운지",
      detailBullets: accessibilityBullets(report, a11y),
    },
    {
      key: "ux",
      label: "사용성",
      score: ux,
      summary: "버튼·화면 배치·조작 흐름",
      detailBullets: uxBullets(report, ux),
    },
    {
      key: "seo",
      label: "SEO",
      score: seoScore,
      summary: "제목·설명·검색 최적화",
      detailBullets: seoBullets(seoScore),
    },
    {
      key: "shareability",
      label: "공유성",
      score: share,
      summary: "Open Graph·SNS 미리보기",
      detailBullets: shareabilityBullets(share),
    },
    {
      key: "security",
      label: "보안",
      score: security,
      summary: "HTTPS·기본 보안 설정",
      detailBullets: securityBullets(report, security),
    },
    {
      key: "stability",
      label: "안정성",
      score: stability,
      summary: "연결 상태·오류·응답 안정성",
      detailBullets: stabilityBullets(report, stability),
    },
  ];

  return axes.map((axis) => {
    const { tier, tierLabel } = scoreTier(axis.score);
    return { ...axis, tier, tierLabel };
  });
}

const DEFAULT_ACTIONS: Record<QualityAxisKey, string[]> = {
  performance: ["이미지·스크립트 최적화", "첫 화면 로딩 개선"],
  accessibility: ["접근성 라벨 보완", "키보드·스크린리더 구조 개선"],
  ux: ["모바일 화면 레이아웃 점검", "버튼·탭 영역 정리"],
  seo: ["메타 설명 보완", "제목 구조 개선"],
  shareability: ["OG 태그 추가", "SNS 미리보기 개선"],
  security: ["HTTPS 적용 확인", "보안 헤더 점검"],
  stability: ["깨진 링크 수정", "스크립트 오류 해결"],
};

export function buildPriorityImprovements(
  axes: QualityAxis[],
): PriorityImprovement[] {
  return [...axes]
    .sort((a, b) => a.score - b.score)
    .filter((a) => a.score < 90)
    .slice(0, 3)
    .map((axis) => {
      const actions =
        axis.detailBullets.length >= 2
          ? axis.detailBullets
              .filter((b) => !/^\w+ 점수 \d+점/.test(b))
              .slice(0, 2)
          : DEFAULT_ACTIONS[axis.key].slice(0, 2);
      const gap = Math.max(0, 85 - axis.score);
      const expectedGain = Math.min(8, Math.max(1, Math.round(gap * 0.15 + 1)));
      return {
        axis,
        urgency: axis.score < 75 ? "high" : "medium",
        actions: actions.length > 0 ? actions : DEFAULT_ACTIONS[axis.key].slice(0, 2),
        expectedGain,
      };
    });
}

export function buildReportKpi(report: ReportJson): ReportKpi {
  const { pages, quick, crawlMeta, timing, brokenLinks, summary } = report;
  const linkCount =
    crawlMeta?.discoveryStats?.linksDiscovered ??
    quick.internalLinkCount ??
    0;
  const issueCount =
    pages.reduce(
      (s, p) =>
        s +
        (p.axeViolations || []).reduce((n, v) => n + v.nodes, 0) +
        (p.uiIssues?.filter((i) => i.severity !== "info").length ?? 0) +
        (p.consoleErrors?.length ?? 0) +
        (p.failedRequests?.length ?? 0),
      0,
    ) + brokenLinks.length;
  const checkItemCount =
    pages.length * 6 + 7 + 3 + (summary.healthBreakdown?.penalties.length ?? 0);

  return {
    pageCount: pages.length,
    linkCount,
    issueCount,
    analysisSeconds: timing?.totalSeconds ?? null,
    checkItemCount,
  };
}

export function dashboardSummaryText(
  status: "Good" | "Warning" | "Critical" | undefined,
): string {
  if (status === "Good") return "전반적으로 양호한 상태입니다.";
  if (status === "Warning") return "개선하면 좋을 부분이 있습니다.";
  if (status === "Critical") return "우선 조치가 필요한 항목이 있습니다.";
  return "품질 진단 결과입니다.";
}
