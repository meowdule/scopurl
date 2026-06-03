"use client";

import { useRef, useState } from "react";
import { Check, Download, Share2 } from "lucide-react";
import type { ReportJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";
import { captureShareCardPng } from "@/lib/shareCardImage";
import { REPORT_SECTION } from "@/lib/reportSections";
import {
  buildPriorityImprovements,
  buildQualityProfile,
  buildReportKpi,
  dashboardSummaryText,
} from "@/lib/qualityProfile";
import { ScoreTierBadge, StatusBadge } from "@/components/ReportCharts";
import { ShareScoreCard } from "@/components/ShareScoreCard";
import { PriorityTop3 } from "@/components/PriorityTop3";
import { PdfDownloadButton } from "@/components/PdfDownloadButton";

type Props = {
  report: ReportJson;
};

export function QualityDashboard({ report }: Props) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { summary, targetUrl, completedAt, crawlMeta, deviceProfile, cardId } =
    report;
  const axes = buildQualityProfile(report);
  const priorities = buildPriorityImprovements(axes);
  const kpi = buildReportKpi(report);
  const profile = deviceProfile || crawlMeta?.deviceProfile;
  const cardPath = cardId ? assetUrl(`/card/${cardId}`) : null;

  const downloadPng = async () => {
    const el = exportRef.current;
    if (!el || downloading) return;
    setDownloading(true);
    try {
      await captureShareCardPng(el);
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
    <section className="mt-4 space-y-6">
      <div
        id={REPORT_SECTION.header}
        data-report-section={REPORT_SECTION.header}
        className="flex flex-wrap items-start justify-between gap-3 border-b border-card-border pb-4"
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-dim">
            Website Quality Report
          </p>
          <p className="mt-1 break-all text-base font-semibold text-fg sm:text-lg">
            {targetUrl}
          </p>
          {completedAt && (
            <p className="mt-1 text-xs text-fg-muted">
              {new Date(completedAt).toLocaleString("ko-KR")}
            </p>
          )}
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
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-fg">품질 인증 카드</h2>
            <p className="text-xs text-fg-muted">
              SNS·메신저 공유용 — 점수와 품질 프로필만 표시됩니다.
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => void downloadPng()}
              disabled={downloading}
              aria-label="PNG 다운로드"
              title="PNG 다운로드 (1200×630)"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-card-border bg-card text-fg hover:border-accent-dim/40 disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden />
            </button>
            {cardPath && (
              <button
                type="button"
                onClick={() => void copyShareUrl()}
                aria-label="공유 페이지 주소 복사"
                title="공유 페이지 주소 복사"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-card-border bg-card text-fg hover:border-accent-dim/40"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-accent-dim" aria-hidden />
                ) : (
                  <Share2 className="h-4 w-4" aria-hidden />
                )}
              </button>
            )}
          </div>
        </div>

        <ShareScoreCard report={report} exportMode={false} />

        <div
          className="pointer-events-none fixed left-[-10000px] top-0 z-[-1] opacity-0"
          aria-hidden
        >
          <div ref={exportRef}>
            <ShareScoreCard report={report} exportMode />
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <h2 className="text-sm font-semibold text-fg">진단 요약</h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <p className="text-4xl font-bold tabular-nums text-fg">
            {summary.healthScore}
          </p>
          {summary.statusLabel && (
            <StatusBadge status={summary.statusLabel} />
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          {dashboardSummaryText(summary.statusLabel)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DiagKpi label="분석 페이지" value={`${kpi.pageCount}개`} />
          <DiagKpi label="발견 링크" value={`${kpi.linkCount}개`} />
          <DiagKpi label="발견 이슈" value={`${kpi.issueCount}건`} />
          <DiagKpi
            label="분석 시간"
            value={
              kpi.analysisSeconds != null
                ? `${Math.round(kpi.analysisSeconds)}초`
                : "—"
            }
          />
        </div>
      </div>

      <div
        id={REPORT_SECTION.axisCards}
        data-report-section={REPORT_SECTION.axisCards}
        className="panel p-4 sm:p-5"
      >
        <h2 className="text-sm font-semibold text-fg">영역별 진단</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {axes.map((axis) => (
            <div
              key={axis.key}
              className="flex items-center justify-between rounded-lg border border-card-border bg-page-alt/40 px-2.5 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-fg">{axis.label}</p>
                <p className="text-lg font-bold tabular-nums leading-tight text-fg">
                  {axis.score}
                </p>
              </div>
              <ScoreTierBadge tier={axis.tier} label={axis.tierLabel} />
            </div>
          ))}
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

function DiagKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-card-border bg-page-alt/30 px-3 py-2.5">
      <p className="text-[10px] font-medium text-fg-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-fg">{value}</p>
    </div>
  );
}
