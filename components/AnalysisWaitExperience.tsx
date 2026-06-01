"use client";

import { useEffect, useRef, useState } from "react";

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

type Props = {
  active: boolean;
};

export function AnalysisWaitExperience({ active }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % TICKER_MESSAGES.length);
    }, 2800);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    let frame = 0;
    let dinoY = H - 24;
    let dinoVy = 0;
    let jumping = false;
    const groundY = H - 16;
    const obstacles: { x: number; w: number; h: number }[] = [];
    let speed = 3;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!jumping) {
          dinoVy = -9;
          jumping = true;
        }
      }
    };
    const onTap = () => {
      if (!jumping) {
        dinoVy = -9;
        jumping = true;
      }
    };
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("click", onTap);

    const loop = () => {
      frame++;
      if (frame % 90 === 0) {
        obstacles.push({ x: W + 10, w: 12 + Math.random() * 16, h: 16 + Math.random() * 12 });
      }
      speed = Math.min(6, 3 + frame / 1200);

      dinoVy += 0.45;
      dinoY += dinoVy;
      if (dinoY >= groundY - 14) {
        dinoY = groundY - 14;
        dinoVy = 0;
        jumping = false;
      }

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(W, groundY);
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(24, dinoY, 18, 14);

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= speed;
        ctx.fillStyle = "#64748b";
        ctx.fillRect(o.x, groundY - o.h, o.w, o.h);
        if (
          o.x < 24 + 18 &&
          o.x + o.w > 24 &&
          dinoY + 14 > groundY - o.h
        ) {
          obstacles.length = 0;
          frame = 0;
          speed = 3;
        }
        if (o.x + o.w < 0) obstacles.splice(i, 1);
      }

      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px sans-serif";
      ctx.fillText("Space / 클릭으로 점프", 8, 12);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("click", onTap);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-surface-border/60 bg-surface/40">
      <div className="relative flex items-center border-b border-surface-border/40 bg-black/20 py-2">
        <div className="animate-marquee whitespace-nowrap text-xs text-slate-400">
          {TICKER_MESSAGES.map((m, i) => (
            <span key={m} className={i === msgIndex ? "text-accent" : ""}>
              {m}
              <span className="mx-6 text-slate-600">·</span>
            </span>
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={360}
        height={80}
        className="mx-auto block w-full max-w-md cursor-pointer"
        aria-label="분석 대기 미니 게임"
      />
    </div>
  );
}
