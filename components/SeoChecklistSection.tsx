"use client";

import type { ReportJson } from "@/lib/types";
import { buildQualityProfile } from "@/lib/qualityProfile";
import { buildSeoChecklist } from "@/lib/reportPdfData";
import { REPORT_SECTION } from "@/lib/reportSections";
import { SeoStatusBadge } from "@/components/ReportCharts";

type Props = { report: ReportJson };

export function SeoChecklistSection({ report }: Props) {
  const axes = buildQualityProfile(report);
  const seoScore = axes.find((a) => a.key === "seo")?.score ?? 0;
  const checklist = buildSeoChecklist(report, seoScore);

  return (
    <section
      id={REPORT_SECTION.seoAnalysis}
      data-report-section={REPORT_SECTION.seoAnalysis}
      className="report-section"
    >
      <h2 className="report-section-title">SEO 분석</h2>
      <p className="report-section-desc">
        현재 SEO 점수{" "}
        <strong className="text-fg">{seoScore}점</strong> — 항목별 점검 결과입니다.
      </p>
      <ul className="mt-5 divide-y divide-card-border overflow-hidden rounded-[16px] border border-card-border bg-card">
        {checklist.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
          >
            <SeoStatusBadge status={item.status} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">{item.label}</p>
              <p className="mt-1 text-sm text-fg-muted">{item.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
