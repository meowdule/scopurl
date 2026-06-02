"use client";

import { ChevronRight } from "lucide-react";
import type { ReportJson } from "@/lib/types";
import { buildQualityProfile } from "@/lib/qualityProfile";
import { REPORT_SECTION } from "@/lib/reportSections";
import { ScoreTierBadge } from "@/components/ReportCharts";

type Props = {
  report: ReportJson;
};

export function ReportScoreDetails({ report }: Props) {
  const axes = buildQualityProfile(report);
  const { summary } = report;
  const bd = summary.healthBreakdown;

  return (
    <section
      id={REPORT_SECTION.detailAccordion}
      data-report-section={REPORT_SECTION.detailAccordion}
      className="panel mt-5"
    >
      <h2 className="text-sm font-semibold text-fg">상세 분석</h2>
      <p className="mt-1 text-xs text-fg-muted">
        필요한 영역만 펼쳐서 확인하세요.
      </p>

      <div className="mt-3 divide-y divide-card-border">
        {axes.map((axis) => (
          <details key={axis.key} className="group py-0.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2 text-sm font-medium text-fg">
                <ChevronRight
                  className="h-4 w-4 text-fg-muted transition group-open:rotate-90"
                  aria-hidden
                />
                {axis.label}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm font-bold tabular-nums text-fg">
                  {axis.score}점
                </span>
                <ScoreTierBadge tier={axis.tier} label={axis.tierLabel} />
              </span>
            </summary>
            <ul className="mb-3 space-y-1.5 pb-1 pl-6 text-sm leading-relaxed text-fg-muted">
              {axis.detailBullets.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      {bd && bd.penalties.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p className="font-semibold">추가 감점 −{bd.penaltyTotal}점</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {bd.penalties.map((p) => (
              <li key={p.id}>· {p.message}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
