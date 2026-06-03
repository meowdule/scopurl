"use client";

import type { ReportJson } from "@/lib/types";
import { collectReportIssues } from "@/lib/reportPdfData";
import { REPORT_SECTION } from "@/lib/reportSections";
import { SeverityBadge } from "@/components/ReportCharts";

type Props = { report: ReportJson };

export function ReportIssuesSection({ report }: Props) {
  const issues = collectReportIssues(report).slice(0, 24);

  return (
    <section
      id={REPORT_SECTION.issuesDetail}
      data-report-section={REPORT_SECTION.issuesDetail}
      className="report-section"
    >
      <h2 className="report-section-title">발견 이슈 상세</h2>
      <p className="report-section-desc">
        심각도 순으로 정렬된 개선 항목입니다.
      </p>
      {issues.length === 0 ? (
        <p className="mt-4 rounded-[16px] border border-card-border bg-card px-5 py-8 text-center text-sm text-fg-muted">
          분석 범위에서 추가 조치가 필요한 이슈가 없습니다.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {issues.map((issue) => (
            <li
              key={issue.id}
              className="rounded-[16px] border border-card-border bg-card p-5"
            >
              <SeverityBadge severity={issue.severity} />
              <h3 className="mt-3 text-sm font-semibold leading-snug text-fg">
                {issue.title}
              </h3>
              <p className="mt-2 text-sm text-fg-muted">
                <span className="font-medium text-fg">영향</span> — {issue.impact}
              </p>
              <p className="mt-1.5 font-mono text-xs text-fg-muted break-all">
                {issue.location}
              </p>
              <div className="mt-3 rounded-[12px] border border-[#eafbf3] bg-[#eafbf3]/50 px-4 py-3 text-sm text-fg">
                <span className="font-medium text-accent-dim">권장 조치</span>
                <span className="text-fg-muted"> — {issue.recommendation}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
