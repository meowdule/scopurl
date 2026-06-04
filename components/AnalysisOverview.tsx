"use client";

import type { ReportJson } from "@/lib/types";
import { buildReportKpi } from "@/lib/qualityProfile";
import { REPORT_SECTION } from "@/lib/reportSections";
import { ReportIcon, Layers, AlertTriangle, Timer, Monitor } from "@/lib/reportIcons";

type Props = { report: ReportJson };

function deviceLabel(report: ReportJson): string {
  const profile = report.deviceProfile || report.crawlMeta?.deviceProfile;
  if (profile === "mobile") return "모바일 390px";
  if (profile === "desktop") return "데스크톱 1440px";
  return "—";
}

export function AnalysisOverview({ report }: Props) {
  const kpi = buildReportKpi(report);

  return (
    <section
      id={REPORT_SECTION.analysisOverview}
      data-report-section={REPORT_SECTION.analysisOverview}
      className="report-meta-strip"
    >
      <h2 className="report-section-title-sm">분석 개요</h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <MetaItem icon={Layers} label="분석 페이지" value={`${kpi.pageCount}개`} />
        <MetaItem icon={AlertTriangle} label="발견 이슈" value={`${kpi.issueCount}건`} />
        <MetaItem
          icon={Timer}
          label="분석 시간"
          value={
            kpi.analysisSeconds != null
              ? `${Math.round(kpi.analysisSeconds)}초`
              : "—"
          }
        />
        <MetaItem icon={Monitor} label="분석 환경" value={deviceLabel(report)} />
      </dl>
    </section>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2.5">
      <ReportIcon icon={Icon} className="mt-0.5 text-accent-dim" />
      <div>
        <dt className="text-xs text-fg-muted">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold tabular-nums text-fg">{value}</dd>
      </div>
    </div>
  );
}
