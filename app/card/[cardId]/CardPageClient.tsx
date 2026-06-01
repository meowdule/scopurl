"use client";

import { useEffect, useState } from "react";
import type { ScoreCardJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";
import { DonutChart, StatusBadge } from "@/components/ReportCharts";
import Link from "next/link";

export function CardPageClient({ cardId }: { cardId: string }) {
  const [card, setCard] = useState<ScoreCardJson | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cardId === "placeholder") {
      setError("아직 공유된 점수 카드가 없습니다.");
      return;
    }
    fetch(assetUrl(`/cards/${cardId}.json`))
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setCard)
      .catch(() => setError("점수 카드를 찾을 수 없습니다."));
  }, [cardId]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-slate-400">
        <p>{error}</p>
        <Link href={assetUrl("/")} className="mt-4 inline-block text-accent">
          홈으로
        </Link>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-slate-400">
        로딩 중…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-xl border border-surface-border bg-surface-raised p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          SnapIt SiteScope
        </p>
        <div className="mt-6 flex items-center gap-4">
          <DonutChart value={card.overallScore} label="종합" size={96} />
          <div>
            {card.statusLabel && <StatusBadge status={card.statusLabel} />}
            <p className="mt-2 text-xs text-slate-500">
              {new Date(card.generatedAt).toLocaleString("ko-KR")}
            </p>
          </div>
        </div>
        {card.categoryScores && (
          <div className="mt-6 grid grid-cols-2 gap-2 text-sm text-slate-300">
            <span>성능 {card.categoryScores.performance ?? "—"}</span>
            <span>접근성 {card.categoryScores.accessibility ?? "—"}</span>
            <span>사용성 {card.categoryScores.ux ?? "—"}</span>
            <span>검색·공유 {card.categoryScores.seo ?? "—"}</span>
          </div>
        )}
        {(card.topImprovements?.length ?? 0) > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium text-slate-400">주요 개선 포인트</p>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-300">
              {card.topImprovements!.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Link
        href={assetUrl("/")}
        className="mt-8 text-center text-sm text-accent hover:underline"
      >
        SnapIt SiteScope에서 분석하기
      </Link>
    </div>
  );
}
