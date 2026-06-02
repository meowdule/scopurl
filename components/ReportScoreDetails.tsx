"use client";

import type { ReportJson } from "@/lib/types";
import { PdfDownloadButton } from "@/components/PdfDownloadButton";
import { ProgressBar } from "@/components/ReportCharts";

type Props = {
  report: ReportJson;
};

export function ReportScoreDetails({ report }: Props) {
  const { summary, targetUrl, crawlMeta, deviceProfile } = report;
  const cats = summary.categoryScores;
  const bd = summary.healthBreakdown;
  const profile = deviceProfile || crawlMeta?.deviceProfile;

  return (
    <section className="panel mt-8">
      <h2 className="text-sm font-semibold text-fg">상세 분석</h2>
      <p className="mt-1 text-sm text-fg-muted">
        영역별 점수와 리포트에 반영된 세부 내용입니다.
      </p>

      <div className="mt-5 border-b border-card-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-dim">
          scopurl 리포트
        </p>
        <p className="mt-2 break-all text-xl font-bold text-fg sm:text-2xl">
          {targetUrl}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 print:hidden">
          <PdfDownloadButton reportId={report.reportId} targetUrl={targetUrl} />
          {profile && (
            <span className="rounded-full border border-card-border bg-page px-3 py-1 text-xs font-medium text-fg">
              {profile === "mobile"
                ? "모바일 화면 (390px) 분석"
                : "데스크톱 화면 (1440px) 분석"}
            </span>
          )}
        </div>
      </div>

      {cats && (
        <div className="mt-6 grid gap-4">
          <ProgressBar value={cats.performance} label="성능 · 페이지 로딩" />
          <ProgressBar
            value={cats.accessibility}
            label="접근성 · 누구나 쓰기 쉬운지"
          />
          <ProgressBar value={cats.ux} label="사용성 · 버튼·화면 배치" />
          <ProgressBar value={cats.seo} label="검색·공유 · 검색·미리보기" />
        </div>
      )}

      {bd && bd.explanation.length > 0 && (
        <ul className="mt-6 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-fg-muted">
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
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
          <p className="font-semibold">모바일에서 확인할 점</p>
          <ul className="mt-1 list-inside list-disc leading-relaxed">
            {summary.mobileWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
