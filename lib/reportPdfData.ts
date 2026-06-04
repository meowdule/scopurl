import type { PageReport, ReportJson } from "@/lib/types";
import type { QualityAxis } from "@/lib/qualityProfile";
import { buildQualityProfile, buildPriorityImprovements } from "@/lib/qualityProfile";
import { SEO_WHY_IMPORTANT } from "@/lib/pdfTheme";

export type IssueSeverity = "critical" | "high" | "medium" | "low";

export type ReportIssue = {
  id: string;
  severity: IssueSeverity;
  title: string;
  impact: string;
  location: string;
  recommendation: string;
  source: string;
};

const IMPACT_MAP: Record<string, IssueSeverity> = {
  critical: "critical",
  serious: "high",
  moderate: "medium",
  minor: "low",
};

function axeSeverity(impact?: string): IssueSeverity {
  if (!impact) return "medium";
  return IMPACT_MAP[impact.toLowerCase()] ?? "medium";
}

export function collectReportIssues(report: ReportJson): ReportIssue[] {
  const issues: ReportIssue[] = [];

  for (const p of report.pages) {
    for (const v of p.axeViolations || []) {
      issues.push({
        id: `axe-${p.url}-${v.id}`,
        severity: axeSeverity(v.impact),
        title: v.description || v.id,
        impact: "접근성·사용성에 영향을 줄 수 있습니다.",
        location: p.url,
        recommendation: "해당 요소의 라벨·구조·대체 텍스트를 보완하세요.",
        source: "접근성 검사",
      });
    }
    for (const u of p.uiIssues || []) {
      if (u.severity === "info") continue;
      issues.push({
        id: `ui-${p.url}-${u.id}`,
        severity: u.severity === "error" ? "high" : "medium",
        title: u.friendlyMessage || u.message,
        impact: u.userImpact || "모바일·데스크톱 이용 시 불편이 생길 수 있습니다.",
        location: `${p.url} (${u.viewport})`,
        recommendation: "레이아웃·터치 영역·스크롤 동작을 점검하세요.",
        source: "화면 분석",
      });
    }
    for (const e of p.consoleErrors || []) {
      issues.push({
        id: `console-${p.url}-${e.slice(0, 40)}`,
        severity: "medium",
        title: "스크립트 오류",
        impact: "일부 기능이 정상 동작하지 않을 수 있습니다.",
        location: p.url,
        recommendation: e.slice(0, 120),
        source: "브라우저 콘솔",
      });
    }
  }

  for (const b of report.brokenLinks.slice(0, 30)) {
    issues.push({
      id: `link-${b.from}-${b.to}`,
      severity: "high",
      title: "깨진 링크",
      impact: "사용자 이동 실패·신뢰도 저하 가능",
      location: `${b.from} → ${b.to}`,
      recommendation: "대상 URL 수정 또는 링크 제거",
      source: "링크 검사",
    });
  }

  for (const p of report.summary.healthBreakdown?.penalties || []) {
    issues.push({
      id: `penalty-${p.id}`,
      severity: "medium",
      title: p.label,
      impact: p.message,
      location: "사이트 전체",
      recommendation: "감점 요인을 해소하면 종합 점수가 상승합니다.",
      source: "점수 산정",
    });
  }

  const order: Record<IssueSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

export type SeoCheckItem = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail" | "unknown";
  note: string;
  whyImportant: string;
};

export function buildSeoChecklist(report: ReportJson, seoScore: number): SeoCheckItem[] {
  const lhSeo = report.pages
    .map((p) => p.lighthouse?.seo)
    .filter((x): x is number => typeof x === "number");
  const hasLh = lhSeo.length > 0;
  const avg = hasLh
    ? Math.round(lhSeo.reduce((a, b) => a + b, 0) / lhSeo.length)
    : seoScore;

  const tier = (n: number): SeoCheckItem["status"] =>
    n >= 80 ? "pass" : n >= 60 ? "warn" : "fail";

  const items: Omit<SeoCheckItem, "whyImportant">[] = [
    {
      id: "title",
      label: "페이지 제목 (Title)",
      status: tier(avg),
      note: "검색 결과에 노출되는 제목 구조를 점검했습니다.",
    },
    {
      id: "meta",
      label: "메타 설명 (Description)",
      status: seoScore < 80 ? "warn" : "pass",
      note: "검색 스니펫 품질에 영향을 줍니다.",
    },
    {
      id: "og",
      label: "Open Graph / SNS 미리보기",
      status: seoScore < 78 ? "warn" : "pass",
      note: "링크 공유 시 미리보기 품질과 관련됩니다.",
    },
    {
      id: "canonical",
      label: "Canonical URL",
      status: "unknown",
      note: "중복 URL 통합 설정은 상세 크롤에서 확인이 필요합니다.",
    },
    {
      id: "robots",
      label: "Robots / 색인",
      status: "unknown",
      note: "검색 엔진 크롤링 정책은 별도 확인을 권장합니다.",
    },
    {
      id: "structured",
      label: "구조화 데이터",
      status: avg < 75 ? "warn" : "pass",
      note: "리치 결과·검색 이해에 도움이 됩니다.",
    },
  ];
  return items.map((item) => ({
    ...item,
    whyImportant: SEO_WHY_IMPORTANT[item.id] ?? item.note,
  }));
}

export function pageAxeCount(p: PageReport): number {
  return (p.axeViolations || []).reduce((s, v) => s + v.nodes, 0);
}

export function buildPdfContext(report: ReportJson) {
  const axes = buildQualityProfile(report);
  const priorities = buildPriorityImprovements(axes);
  const issues = collectReportIssues(report);
  const seoScore = axes.find((a) => a.key === "seo")?.score ?? 0;
  return {
    axes,
    priorities,
    issues,
    seoChecklist: buildSeoChecklist(report, seoScore),
  };
}
