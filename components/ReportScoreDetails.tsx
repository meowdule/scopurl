"use client";

import type { ReportJson } from "@/lib/types";
import { buildQualityProfile } from "@/lib/qualityProfile";

type Props = {
  report: ReportJson;
};

export function ReportScoreDetails({ report }: Props) {
  const axes = buildQualityProfile(report);
  const { summary } = report;
  const bd = summary.healthBreakdown;

  return (
    <section className="panel mt-8">
      <h2 className="text-sm font-semibold text-fg">상세 분석</h2>
      <p className="mt-1 text-sm text-fg-muted">
        각 영역에서 확인된 내용과 개선 방향입니다.
      </p>

      <div className="mt-6 space-y-5">
        {axes.map((axis) => (
          <div
            key={axis.key}
            className="border-b border-card-border pb-5 last:border-0 last:pb-0"
          >
            <h3 className="text-sm font-semibold text-fg">{axis.label}</h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-fg-muted">
              {axis.detailBullets.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-fg-muted/60">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {bd && bd.penalties.length > 0 && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">추가 감점 −{bd.penaltyTotal}점</p>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed">
            {bd.penalties.map((p) => (
              <li key={p.id}>· {p.message}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
