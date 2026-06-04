import type { QualityAxisKey } from "@/lib/qualityProfile";
import { buildQualityProfile } from "@/lib/qualityProfile";
import type { ReportJson, ScoreCardJson } from "@/lib/types";

export type ShareAxisPoint = {
  key: QualityAxisKey;
  label: string;
  score: number;
};

export type ShareScoreCardData = {
  healthScore: number;
  statusLabel?: "Good" | "Warning" | "Critical";
  completedAt?: string;
  pageCount: number;
  issueCount: number;
  analysisSeconds: number | null;
  axes: ShareAxisPoint[];
};

const AXIS_LABELS: Record<QualityAxisKey, string> = {
  performance: "성능",
  accessibility: "접근성",
  ux: "사용성",
  seo: "SEO",
  shareability: "공유성",
  security: "보안",
  stability: "안정성",
};

function deriveExtraAxes(seo: number) {
  return {
    shareability: Math.min(100, Math.max(0, Math.round(seo + 2))),
    security: 88,
    stability: 85,
  };
}

export function shareCardDataFromReport(report: ReportJson): ShareScoreCardData {
  const axes = buildQualityProfile(report);
  const pages = report.pages.length;
  const issueCount =
    report.pages.reduce(
      (s, p) =>
        s +
        (p.axeViolations || []).reduce((n, v) => n + v.nodes, 0) +
        (p.uiIssues?.filter((i) => i.severity !== "info").length ?? 0),
      0,
    ) + report.brokenLinks.length;

  return {
    healthScore: report.summary.healthScore,
    statusLabel: report.summary.statusLabel,
    completedAt: report.completedAt,
    pageCount: pages,
    issueCount,
    analysisSeconds: report.timing?.totalSeconds ?? null,
    axes: axes.map((a) => ({
      key: a.key,
      label: a.label,
      score: a.score,
    })),
  };
}

export function shareCardDataFromScoreCard(card: ScoreCardJson): ShareScoreCardData {
  if (card.axisScores?.length) {
    return {
      healthScore: card.overallScore,
      statusLabel: card.statusLabel,
      completedAt: card.generatedAt,
      pageCount: card.pageCount ?? 1,
      issueCount: card.issueCount ?? 0,
      analysisSeconds: card.analysisSeconds ?? null,
      axes: card.axisScores.map((a) => ({
        key: a.key as QualityAxisKey,
        label: a.label,
        score: a.score,
      })),
    };
  }

  const cats = card.categoryScores;
  const perf = cats?.performance ?? 70;
  const a11y = cats?.accessibility ?? 75;
  const ux = cats?.ux ?? 80;
  const seo = cats?.seo ?? 72;
  const extra = deriveExtraAxes(seo);

  const scores: Record<QualityAxisKey, number> = {
    performance: perf,
    accessibility: a11y,
    ux,
    seo,
    shareability: extra.shareability,
    security: extra.security,
    stability: extra.stability,
  };

  return {
    healthScore: card.overallScore,
    statusLabel: card.statusLabel,
    completedAt: card.generatedAt,
    pageCount: card.pageCount ?? 1,
    issueCount: card.issueCount ?? 0,
    analysisSeconds: card.analysisSeconds ?? null,
    axes: (Object.keys(AXIS_LABELS) as QualityAxisKey[]).map((key) => ({
      key,
      label: AXIS_LABELS[key],
      score: scores[key],
    })),
  };
}
