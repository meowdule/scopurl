"use client";

import { useRef, useState } from "react";
import { Check, Download, Share2 } from "lucide-react";
import type { ReportJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";
import { captureElementPng } from "@/lib/shareCardImage";
import { REPORT_SECTION } from "@/lib/reportSections";
import {
  buildPriorityImprovements,
  buildQualityProfile,
  buildReportKpi,
  dashboardSummaryText,
} from "@/lib/qualityProfile";
import { StatusBadge } from "@/components/ReportCharts";
import { RadarChart } from "@/components/RadarChart";
import { PriorityTop3 } from "@/components/PriorityTop3";
import { PdfDownloadButton } from "@/components/PdfDownloadButton";

type Props = {
  report: ReportJson;
};

export function QualityDashboard({ report }: Props) {
  const shareRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { summary, targetUrl, completedAt, crawlMeta, deviceProfile, cardId } =
    report;
  const axes = buildQualityProfile(report);
  const priorities = buildPriorityImprovements(axes);
  const kpi = buildReportKpi(report);
  const profile = deviceProfile || crawlMeta?.deviceProfile;
  const cardPath = cardId ? assetUrl(`/card/${cardId}`) : null;
  const topImprovements = summary.topImprovements?.slice(0, 3) ?? [];

  const downloadPng = async () => {
    const el = shareRef.current;
    if (!el || downloading) return;
    setDownloading(true);
    try {
      await captureElementPng(el, "scopurl-score-card.png");
    } catch {
      window.alert("이미지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setDownloading(false);
    }
  };

  const copyShareUrl = async () => {
    if (!cardPath) return;
    const full =
      typeof window !== "undefined"
        ? `${window.location.origin}${cardPath}`
        : cardPath;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="mt-4 space-y-5">
      <div
        id={REPORT_SECTION.header}
        data-report-section={REPORT_SECTION.header}
        className="flex flex-wrap items-start justify-between gap-3 border-b border-card-border pb-4 print:hidden"
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-dim">
            scopurl 품질 리포트
          </p>
          <p className="mt-1 break-all text-base font-semibold text-fg sm:text-lg">
            {targetUrl}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PdfDownloadButton reportId={report.reportId} targetUrl={targetUrl} />
          {profile && (
            <span className="rounded-full border border-card-border bg-page px-2.5 py-0.5 text-xs text-fg">
              {profile === "mobile" ? "모바일" : "데스크톱"}
            </span>
          )}
        </div>
      </div>

      <div
        id={REPORT_SECTION.heroShareCard}
        data-report-section={REPORT_SECTION.heroShareCard}
        className="panel relative overflow-hidden p-4 sm:p-5"
      >
        <div className="absolute right-3 top-3 z-10 flex gap-1.5 print:hidden">
          <button
            type="button"
            onClick={() => void downloadPng()}
            disabled={downloading}
            aria-label="PNG 다운로드"
            title="PNG 다운로드"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-card text-fg hover:border-accent-dim/40 disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden />
          </button>
          {cardPath && (
            <button
              type="button"
              onClick={() => void copyShareUrl()}
              aria-label="공유 페이지 주소 복사"
              title="공유 페이지 주소 복사"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-card-border bg-card text-fg hover:border-accent-dim/40"
            >
              {copied ? (
                <Check className="h-4 w-4 text-accent-dim" aria-hidden />
              ) : (
                <Share2 className="h-4 w-4" aria-hidden />
              )}
            </button>
          )}
        </div>

        <div
          ref={shareRef}
          className="rounded-lg bg-[#f4f7fb] p-4 pr-16 sm:pr-20"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#00a85f]">
            scopurl
          </p>

          <div className="mt-3 space-y-4">
            <div>
              <div className="flex flex-wrap items-end gap-3">
                <p className="text-5xl font-bold tabular-nums leading-none text-[#0f172a] sm:text-6xl">
                  {summary.healthScore}
                </p>
                {summary.statusLabel && (
                  <StatusBadge status={summary.statusLabel} />
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#0f172a]">
                {dashboardSummaryText(summary.statusLabel)}
              </p>
              {completedAt && (
                <p className="mt-1 text-xs text-[#64748b]">
                  {new Date(completedAt).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <KpiInline label="분석 페이지" value={`${kpi.pageCount}개`} />
                <KpiInline label="발견 링크" value={`${kpi.linkCount}개`} />
                <KpiInline label="발견 이슈" value={`${kpi.issueCount}건`} />
                <KpiInline
                  label="분석 시간"
                  value={
                    kpi.analysisSeconds != null
                      ? `${Math.round(kpi.analysisSeconds)}초`
                      : "—"
                  }
                />
              </div>

              <div className="flex justify-center">
                <RadarChart
                  axes={axes}
                  size={240}
                  showScores
                  className="h-[240px] w-[240px]"
                />
              </div>

              {topImprovements.length > 0 && (
                <ul className="mt-4 space-y-1 border-t border-[#e2e8f0] pt-3 text-xs leading-relaxed text-[#64748b]">
                  {topImprovements.map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {priorities.length > 0 && (
        <div
          id={REPORT_SECTION.priorityTop3}
          data-report-section={REPORT_SECTION.priorityTop3}
        >
          <PriorityTop3 items={priorities} />
        </div>
      )}
    </section>
  );
}

function KpiInline({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e2e8f0] bg-white px-2.5 py-2">
      <p className="text-[10px] text-[#64748b]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#0f172a]">
        {value}
      </p>
    </div>
  );
}
