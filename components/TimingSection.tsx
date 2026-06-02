"use client";

import { useState } from "react";
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
  const [showTimeline, setShowTimeline] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
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

  const hasPhases =
    timing.phases && Object.keys(timing.phases).length > 0;

  return (
    <section className="panel mt-5">
      <h2 className="text-sm font-semibold text-fg">분석 과정</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryChip
          label="분석 시간"
          value={total > 0 ? `${Math.round(total)}초` : "—"}
        />
        <SummaryChip label="체크 항목" value={`${kpi.checkItemCount}개`} />
        <SummaryChip label="분석 페이지" value={`${kpi.pageCount}개`} />
        <SummaryChip label="발견 링크" value={`${kpi.linkCount}개`} />
      </div>

      {startedAt && completedAt && (
        <div className="mt-3 print:hidden">
          <button
            type="button"
            onClick={() => setShowTimeline((v) => !v)}
            className="text-xs font-medium text-accent-dim hover:underline"
          >
            {showTimeline ? "분석 과정 접기" : "분석 과정 보기"}
          </button>
          {showTimeline && (
            <ol className="relative mt-4 space-y-0 border-l-2 border-accent/30 pl-5">
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
        </div>
      )}

      {hasPhases && (
        <div className="mt-3 border-t border-card-border pt-3 print:hidden">
          <button
            type="button"
            onClick={() => setShowTechnical((v) => !v)}
            className="text-xs font-medium text-fg-muted hover:text-fg"
          >
            {showTechnical ? "기술 상세 접기" : "기술 상세 보기"}
          </button>
          {showTechnical && (
            <ul className="mt-3 space-y-1 text-xs text-fg-muted">
              {Object.entries(timing.phases!)
                .sort(([, a], [, b]) => b - a)
                .map(([key, sec]) => (
                  <li key={key} className="flex justify-between gap-4">
                    <span>{humanizePhaseKey(key)}</span>
                    <span className="tabular-nums">{sec.toFixed(1)}초</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-card-border/80 bg-page-alt/40 px-2.5 py-2">
      <p className="text-[10px] text-fg-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-fg">{value}</p>
    </div>
  );
}

function TimelineNode({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="relative pb-5 last:pb-0">
      <span
        className="absolute -left-[calc(1.25rem+5px)] top-1.5 h-2 w-2 rounded-full border-2 border-accent bg-card"
        aria-hidden
      />
      <p className="text-sm font-medium text-fg">{label}</p>
      <p className="mt-0.5 text-xs tabular-nums text-fg-muted">{detail}</p>
    </li>
  );
}
