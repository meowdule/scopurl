"use client";

import { useEffect, useState } from "react";
import type { ScoreCardJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";
import { fetchReport } from "@/lib/pollReport";
import { ShareScoreCard } from "@/components/ShareScoreCard";
import {
  shareCardDataFromReport,
  shareCardDataFromScoreCard,
  type ShareScoreCardData,
} from "@/lib/shareCardData";
import Link from "next/link";

export function CardPageClient({ cardId }: { cardId: string }) {
  const [card, setCard] = useState<ScoreCardJson | null>(null);
  const [shareData, setShareData] = useState<ShareScoreCardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cardId === "placeholder") {
      setError("아직 공유된 점수 카드가 없습니다.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(assetUrl(`/cards/${cardId}.json`));
        if (!res.ok) throw new Error("not found");
        const json = (await res.json()) as ScoreCardJson;
        if (cancelled) return;
        setCard(json);

        if (json.reportId) {
          const report = await fetchReport(json.reportId);
          if (!cancelled && report) {
            setShareData(shareCardDataFromReport(report));
            return;
          }
        }
        if (!cancelled) setShareData(shareCardDataFromScoreCard(json));
      } catch {
        if (!cancelled) setError("점수 카드를 찾을 수 없습니다.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-fg-muted">
        <p>{error}</p>
        <Link href={assetUrl("/")} className="mt-4 inline-block text-accent-dim">
          홈으로
        </Link>
      </div>
    );
  }

  if (!card || !shareData) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center text-fg-muted">
        로딩 중…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-12">
      <div className="w-full max-w-[720px]">
        <ShareScoreCard data={shareData} />
      </div>
      <Link
        href={assetUrl("/")}
        className="mt-8 text-center text-sm font-medium text-accent-dim hover:underline"
      >
        SCOPURL에서 분석하기
      </Link>
    </div>
  );
}
