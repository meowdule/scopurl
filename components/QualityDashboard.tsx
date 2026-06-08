"use client";

import { useRef, useState } from "react";
import { Check, Download, Share2 } from "lucide-react";
import type { ReportJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";
import { captureShareCardPng } from "@/lib/shareCardImage";
import { REPORT_SECTION } from "@/lib/reportSections";
import { ShareScoreCardFromReport } from "@/components/ShareScoreCard";
import { PdfDownloadButton } from "@/components/PdfDownloadButton";
import { AnalysisOverview } from "@/components/AnalysisOverview";

type Props = {
  report: ReportJson;
};

export function QualityDashboard({ report }: Props) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { targetUrl, completedAt, crawlMeta, deviceProfile, cardId } = report;
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
    <section className="space-y-8">
      <div
        id={REPORT_SECTION.header}
        data-report-section={REPORT_SECTION.header}
        className="flex flex-wrap items-start justify-between gap-3 border-b border-card-border pb-5"
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
            <span className="rounded-full border border-card-border bg-page px-2.5 py-1 text-xs text-fg">
              {profile === "mobile" ? "모바일" : "데스크톱"}
            </span>
          )}
        </div>
      </div>

      <AnalysisOverview report={report} />

      <div
        id={REPORT_SECTION.heroShareCard}
        data-report-section={REPORT_SECTION.heroShareCard}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="report-section-title">품질 인증 카드</h2>
            <p className="report-section-desc">
              SNS·메신저 공유용 — 점수와 품질 프로필만 표시됩니다.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => void downloadPng()}
              disabled={downloading}
              aria-label="PNG 다운로드"
              title="PNG 다운로드 (1200×400~780)"
              className="btn-icon-secondary"
            >
              <Download className="h-4 w-4" aria-hidden />
            </button>
            {cardPath && (
              <button
                type="button"
                onClick={() => void copyShareUrl()}
                aria-label="공유 페이지 주소 복사"
                title="공유 페이지 주소 복사"
                className="btn-icon-secondary"
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

        <ShareScoreCardFromReport report={report} exportMode={false} />

        <div
          className="pointer-events-none fixed left-[-10000px] top-0 z-[-1] opacity-0"
          aria-hidden
        >
          <div ref={exportRef}>
            <ShareScoreCardFromReport report={report} exportMode />
          </div>
        </div>
      </div>
    </section>
  );
}
