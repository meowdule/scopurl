"use client";

import { useRef, useState } from "react";
import { Check, Download, Share2 } from "lucide-react";
import type { ReportJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";
import { statusSummaryText } from "@/lib/reportCopy";
import { DonutChart, StatusBadge } from "@/components/ReportCharts";

type Props = {
  report: ReportJson;
};

export function ScoreCardShare({ report }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const { summary, cardId, completedAt } = report;
  const improvements =
    (summary as { topImprovements?: string[] }).topImprovements || [];

  const cardPath = cardId ? assetUrl(`/card/${cardId}`) : null;

  const downloadPng = async () => {
    const el = cardRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const data = new XMLSerializer().serializeToString(
      new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            ${el.outerHTML}
          </foreignObject>
        </svg>`,
        "image/svg+xml",
      ).documentElement,
    );
    const img = new Image();
    const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((b) => {
          if (!b) return reject();
          const a = document.createElement("a");
          a.href = URL.createObjectURL(b);
          a.download = "scopurl-score-card.png";
          a.click();
          resolve();
        }, "image/png");
      };
      img.onerror = reject;
      img.src = url;
    });
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
    <section className="panel mt-4 print:hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-fg">품질 점수</h2>
          <p className="mt-1 text-sm text-fg-muted">
            사이트 주소 없이 점수와 개선 포인트만 공유할 수 있습니다.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => void downloadPng()}
            aria-label="PNG 다운로드"
            title="PNG 다운로드"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-card-border bg-card text-fg transition hover:border-accent-dim/40 hover:text-accent-dim"
          >
            <Download className="h-4 w-4" aria-hidden />
          </button>
          {cardPath && (
            <button
              type="button"
              onClick={() => void copyShareUrl()}
              aria-label="공유 페이지 주소 복사"
              title="공유 페이지 주소 복사"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-card-border bg-card text-fg transition hover:border-accent-dim/40 hover:text-accent-dim"
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

      <div
        ref={cardRef}
        className="mt-4 rounded-xl border border-card-border bg-page-alt/50 p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-dim">
          scopurl
        </p>
        <div className="mt-4 flex flex-wrap items-start gap-6">
          <DonutChart value={summary.healthScore} label="종합" size={112} />
          <div className="min-w-[200px] flex-1">
            {summary.statusLabel && (
              <StatusBadge status={summary.statusLabel} />
            )}
            <p className="mt-2 text-sm leading-relaxed text-fg">
              {statusSummaryText(summary.statusLabel, summary.healthScore)}
            </p>
            {completedAt && (
              <p className="mt-1 text-xs text-fg-muted">
                {new Date(completedAt).toLocaleString("ko-KR")}
              </p>
            )}
          </div>
        </div>
        {summary.categoryScores && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DonutChart
              value={summary.categoryScores.performance}
              label="성능"
              size={72}
            />
            <DonutChart
              value={summary.categoryScores.accessibility}
              label="접근성"
              size={72}
            />
            <DonutChart value={summary.categoryScores.ux} label="사용성" size={72} />
            <DonutChart
              value={summary.categoryScores.seo}
              label="검색·공유"
              size={72}
            />
          </div>
        )}
        {improvements.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium text-fg-muted">주요 개선 포인트</p>
            <ul className="mt-2 list-inside list-disc text-sm leading-relaxed text-fg-muted">
              {improvements.slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
