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
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 print:text-black">
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

      <ExtendedReportCta defaultSiteUrl={targetUrl} />

      <ReportScoreDetails report={report} />

      <section className="panel mt-5 overflow-x-auto">
        <h2 className="text-sm font-semibold text-fg">분석한 페이지</h2>
        <table className="mt-3 w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-card-border text-xs text-fg-muted">
              <th className="py-2 pr-3 font-medium">주소</th>
              <th className="py-2 pr-3 font-medium">접속</th>
              <th className="py-2 pr-3 font-medium">성능</th>
              <th className="py-2 font-medium">접근성</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr
                key={p.url}
                className="border-b border-card-border/60 text-fg"
              >
                <td className="max-w-[200px] truncate py-2 pr-3 text-xs text-fg-muted">
                  {p.url}
                </td>
                <td className="py-2 pr-3 tabular-nums text-xs">
                  {p.statusCode ?? "—"}
                </td>
                <td className="py-2 pr-3 tabular-nums text-xs">
                  {p.lighthouse?.performance ?? "—"}
                </td>
                <td className="py-2 tabular-nums text-xs">
                  {(p.axeViolations || []).reduce((s, v) => s + v.nodes, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {brokenLinks.length > 0 && (
        <section className="panel mt-5">
          <h2 className="text-sm font-semibold text-fg">깨진 링크</h2>
          <ul className="mt-2 space-y-1.5 text-xs text-fg-muted">
            {brokenLinks.slice(0, 10).map((b) => (
              <li
                key={`${b.from}-${b.to}`}
                className="rounded-md border border-card-border px-3 py-2"
              >
                {b.from} → {b.to}
              </li>
            ))}
          </ul>
        </section>
      )}

      {timing && <TimingSection timing={timing} report={report} />}
    </div>
  );
}
