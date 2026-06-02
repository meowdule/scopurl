"use client";

import type { ReportJson, TimingReport } from "@/lib/types";
import {
  humanizePhaseKey,
  humanizeTimingSummaryLine,
} from "@/lib/reportCopy";
import { buildReportKpi } from "@/lib/qualityProfile";

type Props = {
  timing: TimingReport;
  report: ReportJson;
};

export function TimingSection({ timing, report }: Props) {
  const total = timing.totalSeconds ?? 0;
  const kpi = buildReportKpi(report);
  const completedAt = report.completedAt
    ? new Date(report.completedAt)
    : null;
  const startedAt =
    completedAt && total > 0
      ? new Date(completedAt.getTime() - total * 1000)
      : report.createdAt
        ? new Date(report.createdAt)
        : null;

  const steps = timing.summary
    .map(humanizeTimingSummaryLine)
    .filter((r) => r.seconds > 0)
    .sort((a, b) => {
      const order = [
        "빠른 연결 점검",
        "사이트 페이지 모으기",
        "페이지 품질 분석",
        "로딩·성능 측정",
        "접근성 점검",
      ];
      const ai = order.indexOf(a.label);
      const bi = order.indexOf(b.label);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return b.seconds - a.seconds;
    })
    .slice(0, 4);

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  return (
    <section className="panel mt-8">
      <h2 className="text-sm font-semibold text-fg">분석 과정</h2>
      <p className="mt-1 text-sm text-fg-muted">
        분석이 진행된 순서와 소요 시간입니다.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryChip
          label="분석 시간"
          value={total > 0 ? `${Math.round(total)}초` : "—"}
        />
        <SummaryChip
          label="체크 항목"
          value={`${kpi.checkItemCount}개`}
        />
        <SummaryChip
          label="분석 페이지"
          value={`${kpi.pageCount}개`}
        />
        <SummaryChip label="발견 링크" value={`${kpi.linkCount}개`} />
      </div>

      {startedAt && completedAt && (
        <ol className="relative mt-8 space-y-0 border-l-2 border-accent/30 pl-6">
          <TimelineNode label="분석 시작" detail={fmtTime(startedAt)} />

          {steps.map((step) => (
            <TimelineNode
              key={step.label}
              label={step.label}
              detail={`${step.seconds.toFixed(1)}초`}
            />
          ))}

          <TimelineNode label="분석 완료" detail={fmtTime(completedAt)} />
        </ol>
      )}

      {timing.phases && Object.keys(timing.phases).length > 0 && (
        <details className="mt-6 border-t border-card-border pt-4 print:hidden">
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

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-page-alt/40 px-4 py-3">
      <p className="text-xs font-medium text-fg-muted">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-fg">{value}</p>
    </div>
  );
}

function TimelineNode({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="relative pb-6 last:pb-0">
      <span
        className="absolute -left-[calc(1.5rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-accent bg-card"
        aria-hidden
      />
      <p className="text-sm font-medium text-fg">{label}</p>
      <p className="mt-0.5 text-xs tabular-nums text-fg-muted">{detail}</p>
    </li>
  );
}
