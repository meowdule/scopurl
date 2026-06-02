"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
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
    <section className="panel mt-8">
      <h2 className="text-sm font-semibold text-fg">점수 카드 공유</h2>
      <p className="mt-1 text-sm text-fg-muted">
        사이트 주소 없이 점수와 개선 포인트만 공유할 수 있습니다.
      </p>
      <div
        ref={cardRef}
        className="mt-4 rounded-xl border border-card-border bg-page-alt/50 p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-dim">
          scopurl
        </p>
        <div className="mt-4 flex items-center gap-4">
          <DonutChart value={summary.healthScore} label="종합" size={80} />
          <div>
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
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-fg">
            <span>성능 {summary.categoryScores.performance ?? "—"}</span>
            <span>접근성 {summary.categoryScores.accessibility ?? "—"}</span>
            <span>사용성 {summary.categoryScores.ux ?? "—"}</span>
            <span>검색·공유 {summary.categoryScores.seo ?? "—"}</span>
          </div>
        )}
        {improvements.length > 0 && (
          <ul className="mt-4 list-inside list-disc text-sm leading-relaxed text-fg-muted">
            {improvements.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void downloadPng()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-cardSm hover:bg-accent-dim"
        >
          PNG 다운로드
        </button>
        {cardPath && (
          <button
            type="button"
            onClick={() => void copyShareUrl()}
            className="inline-flex items-center gap-2 rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium text-fg hover:border-accent-dim/40"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-accent-dim" aria-hidden />
                복사됨
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-fg-muted" aria-hidden />
                공유 페이지 주소 복사
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
