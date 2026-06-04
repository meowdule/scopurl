"use client";

import type { ReportJson } from "@/lib/types";
import { buildQualityProfile } from "@/lib/qualityProfile";
import { buildSeoChecklist } from "@/lib/reportPdfData";
import { REPORT_SECTION } from "@/lib/reportSections";
import { SeoStatusBadge } from "@/components/ReportCharts";
import { AuditSummaryList } from "@/components/AuditSummaryList";
import { ReportIcon, Search } from "@/lib/reportIcons";

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
      <h2 className="report-section-title flex items-center gap-2">
        <ReportIcon icon={Search} size={20} className="text-fg-muted" />
        SEO 분석
      </h2>
      <p className="report-section-desc">
        현재 SEO 점수{" "}
        <strong className="text-fg">{seoScore}점</strong> — 항목별 점검 결과입니다.
      </p>
      <div className="mt-5">
        <AuditSummaryList
          rows={checklist.map((item) => ({
            id: item.id,
            icon: Search,
            title: item.label,
            description: item.whyImportant,
            trailing: <SeoStatusBadge status={item.status} />,
          }))}
        />
      </div>
    </section>
  );
}
