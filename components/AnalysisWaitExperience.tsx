"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Compass, Sparkles } from "lucide-react";
import {
  ExplorationGame,
  TOTAL_FRAGMENTS,
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

const CANVAS_H = 280;

type Props = {
  active: boolean;
};

export function AnalysisWaitExperience({ active }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [collected, setCollected] = useState(0);
  const [complete, setComplete] = useState(false);
  const [entries, setEntries] = useState<readonly InfoEntry[]>([]);
  const [pickups, setPickups] = useState<readonly PickupToast[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<ExplorationGame | null>(null);
  const keysRef = useRef(new Set<string>());
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const uiTickRef = useRef(0);

  const syncUi = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    setCollected(g.collectedCount);
    setComplete(g.isComplete);
    setEntries([...g.infoPanel.getEntries()]);
  }, []);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % TICKER_MESSAGES.length);
    }, 2800);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const game = new ExplorationGame();
    gameRef.current = game;
    syncUi();

    const onKeyDown = (e: KeyboardEvent) => {
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
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
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
      setCollected(0);
      setComplete(false);
      setEntries([]);
      setPickups([]);
    };
  }, [active, syncUi]);

  if (!active) return null;

  return (
    <section
      className="mb-5 overflow-hidden rounded-panel border border-card-border bg-card shadow-cardSm"
      aria-label="분석 대기 디지털 탐험"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border bg-[#0f172a] px-4 py-3 text-slate-100">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-[#00c471]" aria-hidden />
          분석 대기 중 — 디지털 공간 탐험
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Compass className="h-3.5 w-3.5 text-[#00c471]" aria-hidden />
          <span className="text-slate-300">Data Fragments</span>
          <span className="font-mono text-sm font-bold tabular-nums text-[#00c471]">
            {collected} / {TOTAL_FRAGMENTS}
          </span>
        </div>
      </div>

      <div className="relative flex items-center overflow-hidden border-b border-card-border bg-slate-900/90 py-2">
        <div className="animate-marquee whitespace-nowrap px-4 text-sm font-medium">
          {[...TICKER_MESSAGES, ...TICKER_MESSAGES].map((m, i) => (
            <span
              key={`${m}-${i}`}
              className={
                i % TICKER_MESSAGES.length === msgIndex
                  ? "text-[#00c471]"
                  : "text-slate-500"
              }
            >
              {m}
              <span className="mx-5 text-slate-700">·</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-0 lg:flex-row">
        <div
          ref={wrapRef}
          className="relative min-w-0 flex-1 bg-[#0c1220] outline-none focus-visible:ring-2 focus-visible:ring-[#00c471]/50"
          tabIndex={0}
          role="application"
          aria-label="WASD 또는 방향키로 이동"
        >
          <canvas ref={canvasRef} className="block w-full" />
          <div className="pointer-events-none absolute bottom-10 right-3 z-10 flex w-[min(100%,220px)] flex-col items-end gap-2">
            {pickups.map((p) => {
              const fade = Math.max(0, 1 - p.age / 2.8);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-[#00c471]/35 bg-[#072b22]/95 px-3 py-2 shadow-lg backdrop-blur-sm transition"
                  style={{
                    opacity: fade,
                    transform: `translateY(${(1 - fade) * 12}px) scale(${0.92 + fade * 0.08})`,
                  }}
                >
                  <span className="text-xl leading-none" aria-hidden>
                    {p.emoji}
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="text-[11px] font-bold text-[#a7f3d0]">
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
          {complete && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0c1220]/60">
              <p className="rounded-xl border border-[#00c471]/40 bg-[#072b22]/95 px-5 py-3 text-sm font-semibold text-[#a7f3d0] shadow-lg">
                탐험 완료 — 분석이 끝날 때까지 자유롭게 돌아다녀 보세요
              </p>
            </div>
          )}
          <p className="absolute bottom-2 left-3 right-3 text-center text-[10px] font-medium text-slate-500">
            WASD / 방향키 — 시야 안의 데이터 조각만 수집 · 벽·복도로 탐험
          </p>
        </div>

        <aside className="flex w-full flex-col border-t border-card-border bg-slate-50 lg:w-[220px] lg:border-l lg:border-t-0 dark:bg-slate-900/40">
          <div className="border-b border-card-border px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              디지털 탐험 기록
            </p>
          </div>
          <ul className="max-h-[200px] flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-[280px]">
            {entries.length === 0 ? (
              <li className="text-xs leading-relaxed text-slate-500">
                시야 안으로 들어온 데이터 조각만 보이며, 가까이 가면 수집됩니다.
                건물·복도를 탐험해 보세요.
              </li>
            ) : (
              entries.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border border-card-border bg-white px-2.5 py-2 text-xs leading-relaxed shadow-sm dark:bg-slate-800/80"
                >
                  <p className="font-semibold text-[#00a66a]">{e.tag}</p>
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
