"use client";

import type { ReportJson } from "@/lib/types";
import { statusSummaryText } from "@/lib/reportCopy";
import { DonutChart, StatusBadge } from "@/components/ReportCharts";

type Props = {
  report: ReportJson;
};

export function ExecutiveSummary({ report }: Props) {
  const { summary } = report;
  const bd = summary.healthBreakdown;

  return (
    <section className="panel mt-8 flex flex-wrap items-start gap-6">
      <DonutChart value={summary.healthScore} label="종합 점수" size={112} />
      <div className="min-w-[240px] flex-1">
        {summary.statusLabel && <StatusBadge status={summary.statusLabel} />}
        <p className="mt-3 text-sm leading-relaxed text-fg">
          {statusSummaryText(summary.statusLabel, summary.healthScore)}
        </p>
        {bd && bd.explanation.length > 0 && (
          <ul className="mt-4 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-fg-muted">
            {bd.explanation.slice(0, 4).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        {bd && bd.penalties.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            <p className="font-semibold">추가 감점 −{bd.penaltyTotal}점</p>
            <ul className="mt-1 list-inside list-disc text-xs leading-relaxed">
              {bd.penalties.map((p) => (
                <li key={p.id}>{p.message}</li>
              ))}
            </ul>
          </div>
        )}
        {summary.mobileWarnings.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
            <p className="font-semibold">모바일에서 확인할 점</p>
            <ul className="mt-1 list-inside list-disc leading-relaxed">
              {summary.mobileWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
