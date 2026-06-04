"use client";

import type { ReportJson } from "@/lib/types";
import { collectReportIssues } from "@/lib/reportPdfData";
import { REPORT_SECTION } from "@/lib/reportSections";
import { SeverityBadge } from "@/components/ReportCharts";
import { ReportIcon, AlertTriangle, MapPin, Wrench } from "@/lib/reportIcons";

type Props = { report: ReportJson };

export function ReportIssuesSection({ report }: Props) {
  const issues = collectReportIssues(report).slice(0, 24);

  return (
    <section
      id={REPORT_SECTION.issuesDetail}
      data-report-section={REPORT_SECTION.issuesDetail}
      className="report-section"
    >
      <h2 className="report-section-title flex items-center gap-2">
        <ReportIcon icon={AlertTriangle} size={20} className="text-fg-muted" />
        발견 이슈 상세
      </h2>
      <p className="report-section-desc">
        심각도 순으로 정렬된 개선 항목입니다.
      </p>
      {issues.length === 0 ? (
        <p className="mt-4 rounded-[16px] border border-card-border bg-[#fafbfc] px-5 py-8 text-center text-sm text-fg-muted">
          분석 범위에서 추가 조치가 필요한 이슈가 없습니다.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {issues.map((issue) => (
            <li
              key={issue.id}
              className="flex min-h-[200px] flex-col rounded-[16px] border border-card-border bg-[#fafbfc] p-5 shadow-cardSm"
            >
              <div className="flex items-start justify-between gap-3 border-b border-card-border pb-3">
                <h3 className="flex-1 text-sm font-semibold leading-snug text-fg">
                  {issue.title}
                </h3>
                <SeverityBadge severity={issue.severity} />
              </div>

              <div className="mt-3 flex min-h-[72px] flex-1 flex-col rounded-[12px] border border-card-border bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                  영향
                </p>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fg-muted">
                  {issue.impact}
                </p>
              </div>

              <div className="mt-3 flex min-h-[88px] flex-col rounded-[12px] border border-card-border bg-white px-4 py-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                  <ReportIcon icon={Wrench} size={12} />
                  권장 조치
                </p>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fg">
                  {issue.recommendation}
                </p>
                <p className="mt-2 flex items-start gap-1 font-mono text-[10px] text-fg-muted break-all">
                  <ReportIcon icon={MapPin} size={12} className="mt-0.5 shrink-0" />
                  {issue.location}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
