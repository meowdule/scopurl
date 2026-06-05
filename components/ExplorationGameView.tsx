"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import {
  ExplorationGame,
  FRAGMENTS_PER_STAGE,
  type PickupToast,
} from "@/lib/waitGame/ExplorationGame";
import type { InfoEntry } from "@/lib/waitGame/InfoPanel";

const TICKER_MESSAGES = [
  "DNS 확인 중…",
  "홈페이지 스크린샷 캡처 중…",
  "내부 링크 탐색 중…",
  "Lighthouse 성능 측정 중…",
  "접근성 스캔 중…",
  "모바일 화면 UI 점검 중…",
  "사용자 흐름 탐색 중…",
  "리포트 생성 중…",
];

const CANVAS_H = 360;

type Props = {
  active: boolean;
  /** Standalone /game page — no analysis ticker, replay after clear. */
  standalone?: boolean;
};

export function ExplorationGameView({ active, standalone = false }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [entries, setEntries] = useState<readonly InfoEntry[]>([]);
  const [pickups, setPickups] = useState<readonly PickupToast[]>([]);
  const [missionComplete, setMissionComplete] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [collected, setCollected] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<ExplorationGame | null>(null);
  const keysRef = useRef(new Set<string>());
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const uiTickRef = useRef(0);
  const seedRef = useRef(Date.now());

  const syncUi = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    setEntries([...g.infoPanel.getEntries()]);
    setPickups([...g.pickupToasts]);
    setMissionComplete(g.missionComplete);
    setStageIndex(g.stageIndex);
    setCollected(g.collectedCount);
  }, []);

  const startGame = useCallback(
    (seed: number) => {
      seedRef.current = seed;
      gameRef.current = new ExplorationGame(seed);
      syncUi();
    },
    [syncUi],
  );

  const handleRestart = useCallback(() => {
    setMissionComplete(false);
    startGame(Date.now());
  }, [startGame]);

  useEffect(() => {
    if (!active) return;
    if (!standalone) {
      const id = setInterval(() => {
        setMsgIndex((i) => (i + 1) % TICKER_MESSAGES.length);
      }, 2800);
      return () => clearInterval(id);
    }
  }, [active, standalone]);

  useEffect(() => {
    if (!active) return;

    startGame(seedRef.current);

    const onKeyDown = (e: KeyboardEvent) => {
      if (standalone && gameRef.current?.missionComplete && e.code === "Enter") {
        e.preventDefault();
        handleRestart();
        return;
      }
      const codes = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
      ];
      if (codes.includes(e.code)) {
        e.preventDefault();
        keysRef.current.add(e.code);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const onBlur = () => keysRef.current.clear();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    const loop = (ts: number) => {
      const g = gameRef.current;
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!g || !canvas || !wrap) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const last = lastTsRef.current || ts;
      const dt = Math.min(0.05, (ts - last) / 1000);
      lastTsRef.current = ts;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = CANVAS_H;
      if (
        canvas.width !== Math.floor(w * dpr) ||
        canvas.height !== Math.floor(h * dpr)
      ) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.update(dt, keysRef.current);
        g.render(ctx, w, h);
      }

      uiTickRef.current += dt;
      if (uiTickRef.current >= 0.05) {
        uiTickRef.current = 0;
        syncUi();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      keysRef.current.clear();
      gameRef.current = null;
      lastTsRef.current = 0;
      setEntries([]);
      setPickups([]);
      setMissionComplete(false);
    };
  }, [active, startGame, syncUi, standalone, handleRestart]);

  if (!active) return null;

  return (
    <section
      className="overflow-hidden rounded-panel border border-card-border bg-card shadow-cardSm"
      aria-label={standalone ? "기억 탐험 게임" : "분석 대기 기억 탐험"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-card-border bg-[#030812] px-4 py-2.5 text-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
          <span className="text-sm font-semibold">
            {standalone
              ? "기억 탐험 — 데모 플레이"
              : "분석 대기 중 — 디지털 미로 탐험"}
          </span>
        </div>
        {standalone && (
          <span className="text-xs text-slate-400">
            Stage {stageIndex + 1}/5 · ◆ {collected}/{FRAGMENTS_PER_STAGE}
          </span>
        )}
      </div>

      {!standalone && (
        <div className="relative flex items-center overflow-hidden border-b border-card-border bg-[#030812] py-1.5">
          <div className="animate-marquee whitespace-nowrap px-4 text-xs font-medium">
            {[...TICKER_MESSAGES, ...TICKER_MESSAGES].map((m, i) => (
              <span
                key={`${m}-${i}`}
                className={
                  i % TICKER_MESSAGES.length === msgIndex
                    ? "text-cyan-400"
                    : "text-slate-600"
                }
              >
                {m}
                <span className="mx-4 text-slate-800">·</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-0 lg:flex-row">
        <div
          ref={wrapRef}
          className="relative min-w-0 flex-1 bg-[#020408] outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
          tabIndex={0}
          role="application"
          aria-label="WASD 또는 방향키로 이동"
        >
          <canvas ref={canvasRef} className="block w-full" />
          <div className="pointer-events-none absolute bottom-12 right-3 z-10 flex w-[min(100%,220px)] flex-col items-end gap-2">
            {pickups.map((p) => {
              const fade = Math.max(0, 1 - p.age / 2.8);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-cyan-500/35 bg-[#030812]/95 px-3 py-2 shadow-lg backdrop-blur-sm"
                  style={{
                    opacity: fade,
                    transform: `translateY(${(1 - fade) * 12}px)`,
                  }}
                >
                  <span
                    className="text-sm leading-none text-sky-300"
                    aria-hidden
                  >
                    {p.emoji}
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="text-[11px] font-bold text-cyan-200">
                      {p.title}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {p.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {standalone && missionComplete && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#020408]/75 backdrop-blur-[2px]">
              <div className="pointer-events-auto rounded-xl border border-cyan-500/40 bg-[#030812]/95 px-6 py-5 text-center shadow-xl">
                <p className="text-lg font-bold text-cyan-200">
                  Mission Complete
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  모든 스테이지를 클리어했습니다
                </p>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  새 맵으로 다시 탐험
                </button>
                <p className="mt-2 text-[10px] text-slate-500">
                  Enter 키로도 다시 시작할 수 있습니다
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="flex w-full flex-col border-t border-card-border bg-slate-50 lg:w-[200px] lg:border-l lg:border-t-0 dark:bg-slate-900/40">
          <div className="border-b border-card-border px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {standalone ? "탐험 팁" : "탐험 기록"}
            </p>
          </div>
          <ul className="max-h-[200px] flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-[360px]">
            {standalone && entries.length === 0 ? (
              <li className="text-xs leading-relaxed text-slate-500">
                WASD / 방향키로 이동하세요. 시야 안의 기억 조각 10개를 모으면
                출구가 열립니다. 분석 대기 없이 자유롭게 플레이할 수 있습니다.
              </li>
            ) : entries.length === 0 ? (
              <li className="text-xs leading-relaxed text-slate-500">
                미로를 탐험하며 시야 안의 기억 조각을 수집하세요. 10개를 모으면
                출구가 열립니다.
              </li>
            ) : (
              entries.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border border-card-border bg-white px-2.5 py-2 text-xs leading-relaxed shadow-sm dark:bg-slate-800/80"
                >
                  <p className="font-semibold text-cyan-600">{e.tag}</p>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                    {e.text}
                  </p>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>
    </section>
  );
}
