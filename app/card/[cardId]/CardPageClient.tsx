"use client";

import { useEffect, useState } from "react";
import type { ScoreCardJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";
import { StatusBadge } from "@/components/ReportCharts";
import { dashboardSummaryText } from "@/lib/qualityProfile";
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
      <div className="mx-auto max-w-md px-4 py-20 text-center text-fg-muted">
        <p>{error}</p>
        <Link href={assetUrl("/")} className="mt-4 inline-block text-accent">
          홈으로
        </Link>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-fg-muted">
        로딩 중…
      </div>
    );
  }

  const cats = card.categoryScores;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <div className="panel p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-dim">
          scopurl
        </p>
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <p className="text-5xl font-bold tabular-nums text-fg">
            {card.overallScore}
          </p>
          {card.statusLabel && <StatusBadge status={card.statusLabel} />}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-fg">
          {dashboardSummaryText(card.statusLabel)}
        </p>
        <p className="mt-1 text-xs text-fg-muted">
          {new Date(card.generatedAt).toLocaleString("ko-KR")}
        </p>
        {cats && (
          <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
            <Stat label="성능" value={cats.performance} />
            <Stat label="접근성" value={cats.accessibility} />
            <Stat label="사용성" value={cats.ux} />
            <Stat label="검색·공유" value={cats.seo} />
          </div>
        )}
        {(card.topImprovements?.length ?? 0) > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium text-fg-muted">주요 개선 포인트</p>
            <ul className="mt-2 space-y-1 text-sm text-fg">
              {card.topImprovements!.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Link
        href={assetUrl("/")}
        className="mt-8 text-center text-sm text-accent hover:underline"
      >
        scopurl에서 분석하기
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="rounded-lg border border-card-border bg-page-alt/50 px-3 py-2">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="font-bold tabular-nums text-fg">{value ?? "—"}</p>
    </div>
  );
}
