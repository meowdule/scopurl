"use client";

import type { TimingReport } from "@/lib/types";

const PHASE_LABELS: Record<string, string> = {
  browser_launch: "브라우저 시작",
  quick_scan: "빠른 점검",
  crawl: "URL·페이지 수집",
  page_analysis: "페이지 분석 (전체)",
  report_generation: "리포트 생성",
  initial_load: "초기 로드",
  lighthouse: "Lighthouse",
  accessibility_scan: "접근성 스캔",
  screenshots: "스크린샷",
  hydration_wait: "SPA 대기",
  ui_signals_mobile: "모바일 UI 점검",
};

type Props = {
  timing: TimingReport;
};

export function TimingSection({ timing }: Props) {
  const total = timing.totalSeconds ?? 0;

  return (
    <section className="mt-8 rounded-xl border border-surface-border bg-surface-raised p-5">
      <h2 className="text-sm font-semibold text-white">분석 소요 시간</h2>
      <p className="mt-1 text-xs text-slate-500">
        총 {total > 0 ? `${total.toFixed(1)}초` : "—"} — 어느 단계에서 시간이
        많이 쓰였는지 확인할 수 있습니다.
      </p>
      <ul className="mt-4 space-y-2">
        {timing.summary.map((line) => (
          <li key={line} className="font-mono text-xs text-slate-300">
            {humanizeTimingLine(line)}
          </li>
        ))}
      </ul>
      {timing.phases && Object.keys(timing.phases).length > 0 && (
        <details className="mt-4 border-t border-surface-border pt-4">
          <summary className="cursor-pointer text-xs text-slate-400">
            단계별 상세 (개발자용)
          </summary>
          <ul className="mt-2 space-y-1 font-mono text-xs text-slate-500">
            {Object.entries(timing.phases)
              .sort(([, a], [, b]) => b - a)
              .map(([key, sec]) => (
                <li key={key}>
                  {PHASE_LABELS[key] || key}: {sec.toFixed(1)}s
                </li>
              ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function humanizeTimingLine(line: string): string {
  for (const [key, label] of Object.entries(PHASE_LABELS)) {
    if (line.toLowerCase().includes(key.replace(/_/g, " ")) || line.includes(key)) {
      return line.replace(new RegExp(key, "gi"), label);
    }
  }
  return line;
}
