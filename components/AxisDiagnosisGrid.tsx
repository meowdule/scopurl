"use client";

import type { ReportJson } from "@/lib/types";
import { buildQualityProfile } from "@/lib/qualityProfile";
import { REPORT_SECTION } from "@/lib/reportSections";
import { ScoreTierBadge } from "@/components/ReportCharts";
import { AuditSummaryList } from "@/components/AuditSummaryList";
import { ReportIcon, axisIcon, Gauge } from "@/lib/reportIcons";

type Props = { report: ReportJson };

export function AxisDiagnosisGrid({ report }: Props) {
  const axes = buildQualityProfile(report);

  return (
    <section
      id={REPORT_SECTION.axisCards}
      data-report-section={REPORT_SECTION.axisCards}
      className="report-section"
    >
      <h2 className="report-section-title flex items-center gap-2">
        <ReportIcon icon={Gauge} size={20} className="text-fg-muted" />
        영역별 진단
      </h2>
      <p className="report-section-desc">
        7개 품질 영역을 한눈에 비교할 수 있습니다.
      </p>
      <div className="mt-5">
        <AuditSummaryList
          rows={axes.map((axis) => ({
            id: axis.key,
            icon: axisIcon(axis.key),
            title: axis.label,
            description: axis.cardDescription,
            trailing: (
              <>
                <span className="text-lg font-bold tabular-nums text-fg">
                  {axis.score}점
                </span>
                <ScoreTierBadge tier={axis.tier} label={axis.tierLabel} />
              </>
            ),
          }))}
        />
      </div>
    </section>
  );
}
