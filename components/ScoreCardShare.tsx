"use client";

import { useRef } from "react";
import type { ReportJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";
import { DonutChart, StatusBadge } from "@/components/ReportCharts";

type Props = {
  report: ReportJson;
};

export function ScoreCardShare({ report }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { summary, cardId, completedAt } = report;
  const improvements =
    (summary as { topImprovements?: string[] }).topImprovements || [];

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
    ctx.fillStyle = "#161d27";
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
          a.download = "snapit-score-card.png";
          a.click();
          resolve();
        }, "image/png");
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const cardUrl = cardId ? assetUrl(`/card/${cardId}`) : null;

  return (
    <section className="mt-8 rounded-xl border border-surface-border bg-surface-raised p-5">
      <h2 className="text-sm font-semibold text-white">점수 카드 공유</h2>
      <p className="mt-1 text-xs text-slate-500">
        사이트 주소 없이 점수와 개선 포인트만 공유합니다.
      </p>
      <div
        ref={cardRef}
        className="mt-4 rounded-xl border border-surface-border bg-surface p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          scopurl
        </p>
        <div className="mt-4 flex items-center gap-4">
          <DonutChart value={summary.healthScore} label="종합" size={80} />
          <div>
            {summary.statusLabel && (
              <StatusBadge status={summary.statusLabel} />
            )}
            {completedAt && (
              <p className="mt-2 text-xs text-slate-500">
                {new Date(completedAt).toLocaleString("ko-KR")}
              </p>
            )}
          </div>
        </div>
        {summary.categoryScores && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
            <span>성능 {summary.categoryScores.performance ?? "—"}</span>
            <span>접근성 {summary.categoryScores.accessibility ?? "—"}</span>
            <span>사용성 {summary.categoryScores.ux ?? "—"}</span>
            <span>검색·공유 {summary.categoryScores.seo ?? "—"}</span>
          </div>
        )}
        {improvements.length > 0 && (
          <ul className="mt-4 list-inside list-disc text-xs text-slate-400">
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
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          PNG 다운로드
        </button>
        {cardUrl && (
          <a
            href={cardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-surface-border px-4 py-2 text-sm text-slate-300"
          >
            공유 페이지 열기
          </a>
        )}
      </div>
    </section>
  );
}
