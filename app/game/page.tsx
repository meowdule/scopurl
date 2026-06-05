"use client";

import { ExplorationGameView } from "@/components/ExplorationGameView";

/** 분석 없이 기억 탐험 게임만 플레이 — /report 예시 페이지와 동일한 용도. */
export default function GamePage() {
  return (
    <div className="shell mx-auto max-w-3xl px-5 pb-16 pt-9 sm:px-6">
      <header className="pb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">
          scopurl
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          기억 탐험 게임
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-fg-muted">
          분석 대기 화면에서 즐기는 미니게임을 단독으로 플레이할 수 있습니다.
          매번 다른 방 배치로 5개 스테이지를 탐험해 보세요.
        </p>
      </header>
      <ExplorationGameView active standalone />
    </div>
  );
}
