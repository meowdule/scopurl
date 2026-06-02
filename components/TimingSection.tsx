"use client";

import type { TimingReport } from "@/lib/types";
import {
  humanizePhaseKey,
  humanizeTimingSummaryLine,
} from "@/lib/reportCopy";

type Props = {
  timing: TimingReport;
};

export function TimingSection({ timing }: Props) {
  const total = timing.totalSeconds ?? 0;
  const rows = timing.summary
    .map(humanizeTimingSummaryLine)
    .filter((r) => r.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds);

  const top = rows.slice(0, 5);

  return (
    <section className="panel mt-8">
      <h2 className="text-sm font-semibold text-fg">분석에 시간이 쓰인 부분</h2>
      <p className="mt-1 text-sm text-fg-muted">
        전체 약 {total > 0 ? `${total.toFixed(0)}초` : "—"} 동안 아래 작업을
        수행했습니다. 숫자가 클수록 그 단계에 더 많은 시간이 사용된 것입니다.
      </p>

      {top.length > 0 && total > 0 && (
        <ul className="mt-5 space-y-3">
          {top.map((row) => {
            const pct = Math.min(100, (row.seconds / total) * 100);
            return (
              <li key={row.label}>
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="font-medium text-fg">{row.label}</span>
                  <span className="shrink-0 tabular-nums text-fg-muted">
                    {row.seconds.toFixed(1)}초
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-page">
                  <div
                    className="h-full rounded-full bg-accent-dim"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {timing.phases && Object.keys(timing.phases).length > 0 && (
        <details className="mt-5 border-t border-card-border pt-4">
          <summary className="cursor-pointer text-xs font-medium text-fg-muted">
            기술 상세 (선택)
          </summary>
          <ul className="mt-3 space-y-1 text-xs text-fg-muted">
            {Object.entries(timing.phases)
              .sort(([, a], [, b]) => b - a)
              .map(([key, sec]) => (
                <li key={key} className="flex justify-between gap-4">
                  <span>{humanizePhaseKey(key)}</span>
                  <span className="tabular-nums">{sec.toFixed(1)}초</span>
                </li>
              ))}
          </ul>
        </details>
      )}
    </section>
  );
}
