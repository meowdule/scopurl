"use client";

import type { ReportJson } from "@/lib/types";
import { buildQualityProfile } from "@/lib/qualityProfile";
import { REPORT_SECTION } from "@/lib/reportSections";
import { ScoreTierBadge, TierIndicator } from "@/components/ReportCharts";

type Props = { report: ReportJson };

export function AxisDiagnosisGrid({ report }: Props) {
  const axes = buildQualityProfile(report);

  return (
    <section
      id={REPORT_SECTION.axisCards}
      data-report-section={REPORT_SECTION.axisCards}
      className="report-section"
    >
      <h2 className="report-section-title">영역별 진단</h2>
      <p className="report-section-desc">7개 품질 영역의 점수와 상태입니다.</p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {axes.map((axis) => (
          <article
            key={axis.key}
            className="report-axis-card flex min-h-[148px] flex-col rounded-[16px] border border-card-border bg-card p-5 transition hover:border-accent-dim/30 hover:shadow-cardSm"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-fg">{axis.label}</h3>
              <p className="text-2xl font-bold tabular-nums leading-none text-fg">
                {axis.score}
                <span className="ml-0.5 text-sm font-medium text-fg-muted">점</span>
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ScoreTierBadge tier={axis.tier} label={axis.tierLabel} />
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-fg-muted">
              {axis.cardDescription}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-fg-muted">
              <TierIndicator tier={axis.tier} />
              <span>품질 상태</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
