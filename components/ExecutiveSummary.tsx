"use client";

import type { ReportJson } from "@/lib/types";
import { DonutChart, StatusBadge } from "@/components/ReportCharts";

type Props = {
  report: ReportJson;
};

export function ExecutiveSummary({ report }: Props) {
  const { summary } = report;
  const bd = summary.healthBreakdown;

  return (
    <section className="mt-8 flex flex-wrap items-start gap-6">
      <DonutChart value={summary.healthScore} label="종합 점수" size={112} />
      <div className="min-w-[240px] flex-1">
        {summary.statusLabel && <StatusBadge status={summary.statusLabel} />}
        <p className="mt-3 text-sm text-slate-300">
          {summary.healthScore}점 —{" "}
          {summary.statusLabel === "Good"
            ? "전반적으로 양호합니다."
            : summary.statusLabel === "Warning"
              ? "개선 여지가 있습니다."
              : "우선 조치가 필요합니다."}
        </p>
        {bd && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-slate-500">{bd.formula}</p>
            <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-300">
              {bd.explanation.slice(0, 4).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {bd.penalties.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                <p className="font-medium">추가 감점 −{bd.penaltyTotal}점</p>
                <ul className="mt-1 list-inside list-disc text-xs text-amber-50/90">
                  {bd.penalties.map((p) => (
                    <li key={p.id}>{p.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {summary.mobileWarnings.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-100">
            <p className="font-medium">모바일 주의</p>
            <ul className="mt-1 list-inside list-disc">
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
