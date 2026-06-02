"use client";

import { useEffect, useState } from "react";
import type { ReportJson } from "@/lib/types";
import { fetchReport } from "@/lib/pollReport";
import { assetUrl } from "@/lib/paths";
import Link from "next/link";
import { QualityDashboard } from "@/components/QualityDashboard";
import { ReportScoreDetails } from "@/components/ReportScoreDetails";
import { TimingSection } from "@/components/TimingSection";
import { ExtendedReportCta } from "@/components/ExtendedReportCta";
import { ScoreCardShare } from "@/components/ScoreCardShare";

type Props =
  | { report: ReportJson; reportId?: never; onNewAnalysis?: () => void }
  | { reportId: string; report?: never; onNewAnalysis?: () => void };

export function ReportDashboard({
  reportId,
  report: reportProp,
  onNewAnalysis,
}: Props) {
  const [report, setReport] = useState<ReportJson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reportProp) {
      setReport(reportProp);
      setError(null);
      return;
    }
    if (!reportId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchReport(reportId);
        if (!cancelled) {
          if (!data) setError("리포트를 찾을 수 없습니다.");
          else setReport(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "리포트를 불러오지 못했습니다.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId, reportProp]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-red-700">{error}</p>
        <Link href={assetUrl("/")} className="mt-4 inline-block text-accent-dim">
          홈으로
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-fg-muted">
        리포트 불러오는 중…
      </div>
    );
  }

  const { pages, targetUrl, brokenLinks, timing } = report;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 print:text-black">
      {onNewAnalysis ? (
        <button
          type="button"
          onClick={onNewAnalysis}
          className="text-sm font-medium text-accent-dim hover:underline print:hidden"
        >
          ← 새 분석
        </button>
      ) : (
        <Link
          href={assetUrl("/")}
          className="text-sm font-medium text-accent-dim hover:underline print:hidden"
        >
          ← 새 분석
        </Link>
      )}

      <QualityDashboard report={report} />

      <ReportScoreDetails report={report} />

      {timing && <TimingSection timing={timing} report={report} />}

      <section className="panel mt-8 overflow-x-auto">
        <h2 className="text-sm font-semibold text-fg">분석한 페이지</h2>
        <p className="mt-1 text-sm text-fg-muted">
          각 페이지의 접속 상태와 품질 점수 요약입니다.
        </p>
        <table className="mt-4 w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-card-border text-fg-muted">
              <th className="py-2 pr-4 font-medium">주소</th>
              <th className="py-2 pr-4 font-medium">접속</th>
              <th className="py-2 pr-4 font-medium">성능</th>
              <th className="py-2 pr-4 font-medium">접근성 이슈</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr
                key={p.url}
                className="border-b border-card-border/80 text-fg"
              >
                <td className="max-w-xs truncate py-3 pr-4 text-xs text-fg-muted">
                  {p.url}
                </td>
                <td className="py-3 pr-4 tabular-nums">
                  {p.statusCode ?? "—"}
                </td>
                <td className="py-3 pr-4 tabular-nums">
                  {p.lighthouse?.performance ?? "—"}
                </td>
                <td className="py-3 pr-4 tabular-nums">
                  {(p.axeViolations || []).reduce((s, v) => s + v.nodes, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {brokenLinks.length > 0 && (
        <section className="panel mt-8">
          <h2 className="text-sm font-semibold text-fg">깨진 링크</h2>
          <ul className="mt-4 space-y-2 text-sm text-fg-muted">
            {brokenLinks.slice(0, 20).map((b) => (
              <li
                key={`${b.from}-${b.to}`}
                className="rounded-lg border border-card-border bg-page px-4 py-3"
              >
                <span className="text-xs text-fg-muted">{b.from}</span>
                <span className="mx-2 text-fg">→</span>
                <span className="text-xs text-fg">{b.to}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ScoreCardShare report={report} />

      <ExtendedReportCta defaultSiteUrl={targetUrl} />
    </div>
  );
}
