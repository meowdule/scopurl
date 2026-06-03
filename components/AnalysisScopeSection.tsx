"use client";

import type { ReportJson } from "@/lib/types";
import { buildReportKpi } from "@/lib/qualityProfile";
import { REPORT_SECTION } from "@/lib/reportSections";
import {
  humanizeQuickDetail,
  QUICK_SIGNAL_LABELS,
} from "@/lib/reportCopy";

type Props = { report: ReportJson };

export function AnalysisScopeSection({ report }: Props) {
  const kpi = buildReportKpi(report);
  const { quick, crawlLimits, timing, completedAt, brokenLinks } = report;
  const profile = report.deviceProfile || report.crawlMeta?.deviceProfile;
  const applied = crawlLimits?.applied;

  const rows: { label: string; value: string }[] = [
    { label: "분석 페이지 수", value: `${kpi.pageCount}개` },
    { label: "발견 링크 수", value: `${kpi.linkCount}개` },
    { label: "크롤 깊이", value: applied?.maxDepth != null ? String(applied.maxDepth) : "—" },
    { label: "최대 페이지", value: applied?.maxPages != null ? String(applied.maxPages) : "—" },
    { label: "추적 모드", value: applied?.traceMode ?? "—" },
    {
      label: "분석 환경",
      value:
        profile === "mobile"
          ? "모바일 (390px)"
          : profile === "desktop"
            ? "데스크톱 (1440px)"
            : "—",
    },
    {
      label: "실행 시간",
      value:
        timing?.totalSeconds != null
          ? `${Math.round(timing.totalSeconds)}초`
          : "—",
    },
    {
      label: "생성 시각",
      value: completedAt
        ? new Date(completedAt).toLocaleString("ko-KR")
        : "—",
    },
    {
      label: "DNS",
      value: quick.dnsOk
        ? QUICK_SIGNAL_LABELS.dns.ok
        : QUICK_SIGNAL_LABELS.dns.fail,
    },
    {
      label: "SSL",
      value: quick.sslOk
        ? QUICK_SIGNAL_LABELS.tls.ok
        : QUICK_SIGNAL_LABELS.tls.fail,
    },
    {
      label: "HTTP",
      value: quick.httpOk
        ? `${QUICK_SIGNAL_LABELS.http.ok}${quick.httpStatus != null ? ` (${quick.httpStatus})` : ""}`
        : QUICK_SIGNAL_LABELS.http.fail,
    },
    {
      label: "응답 시간",
      value: quick.responseTimeMs != null ? `${quick.responseTimeMs}ms` : "—",
    },
    {
      label: "콘솔 오류",
      value: `${report.summary.totalConsoleErrors}건`,
    },
    {
      label: "깨진 링크",
      value: `${brokenLinks.length}건`,
    },
  ];

  if (quick.dnsMessage) {
    rows.push({
      label: "DNS 상세",
      value: humanizeQuickDetail("dns", quick.dnsMessage) ?? quick.dnsMessage,
    });
  }

  return (
    <section
      id={REPORT_SECTION.analysisScope}
      data-report-section={REPORT_SECTION.analysisScope}
      className="report-section report-scope"
    >
      <h2 className="report-section-title-sm">분석 범위 · 기술 정보</h2>
      <p className="mt-1 text-xs text-fg-muted">
        진단 실행 조건과 기술 메타데이터입니다.
      </p>
      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="border-b border-card-border/60 pb-3">
            <dt className="text-xs text-fg-muted">{row.label}</dt>
            <dd className="mt-0.5 text-sm text-fg break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
