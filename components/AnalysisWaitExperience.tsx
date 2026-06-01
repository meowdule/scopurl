"use client";

import { useEffect, useRef, useState } from "react";
import {
  Globe,
  Link2,
  Rabbit,
  Server,
  Sparkles,
  Trophy,
} from "lucide-react";

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

const OBSTACLE_KINDS = [Globe, Link2, Server] as const;
const RUNNER_X = 56;
const GAME_H = 200;

type Obstacle = {
  id: number;
  x: number;
  kind: number;
  w: number;
  scored: boolean;
};

type Props = {
  active: boolean;
};

export function AnalysisWaitExperience({ active }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [runnerY, setRunnerY] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [running, setRunning] = useState(true);

  const areaRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef({
    frame: 0,
    runnerY: 0,
    runnerVy: 0,
    jumping: false,
    speed: 4,
    obstacles: [] as Obstacle[],
    nextId: 0,
    score: 0,
    width: 480,
  });
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const stored = localStorage.getItem("scopurl-runner-best");
    if (stored) setBest(Number(stored) || 0);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % TICKER_MESSAGES.length);
    }, 2800);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const jump = () => {
      const g = gameRef.current;
      if (!g.jumping) {
        g.runnerVy = -11;
        g.jumping = true;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener("keydown", onKey);
    areaRef.current?.addEventListener("click", jump);

    const loop = () => {
      const g = gameRef.current;
      const el = areaRef.current;
      if (el) g.width = el.clientWidth;

      g.frame++;
      g.speed = Math.min(9, 4 + g.frame / 900);

      g.runnerVy += 0.52;
      g.runnerY += g.runnerVy;
      const ground = GAME_H - 44;
      const runnerH = 36;
      if (g.runnerY >= 0) {
        g.runnerY = 0;
        g.runnerVy = 0;
        g.jumping = false;
      }

      if (g.frame % 85 === 0) {
        const kind = Math.floor(Math.random() * OBSTACLE_KINDS.length);
        g.obstacles.push({
          id: g.nextId++,
          x: g.width + 20,
          kind,
          w: 28 + Math.random() * 10,
          scored: false,
        });
      }

      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const o = g.obstacles[i];
        o.x -= g.speed;

        if (!o.scored && o.x + o.w < RUNNER_X) {
          o.scored = true;
          g.score += 10;
          setScore(g.score);
          const prevBest = Number(
            localStorage.getItem("scopurl-runner-best") || "0",
          );
          if (g.score > prevBest) {
            localStorage.setItem("scopurl-runner-best", String(g.score));
            setBest(g.score);
          }
        }

        const hit =
          o.x < RUNNER_X + 28 &&
          o.x + o.w > RUNNER_X - 4 &&
          g.runnerY > -runnerH + 8;

        if (hit) {
          g.obstacles = [];
          g.speed = 4;
          g.frame = 0;
          break;
        }

        if (o.x + o.w < -20) g.obstacles.splice(i, 1);
      }

      setRunnerY(g.runnerY);
      setObstacles([...g.obstacles]);
      setRunning(!g.jumping);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKey);
      areaRef.current?.removeEventListener("click", jump);
      gameRef.current = {
        frame: 0,
        runnerY: 0,
        runnerVy: 0,
        jumping: false,
        speed: 4,
        obstacles: [],
        nextId: 0,
        score: 0,
        width: 480,
      };
      setScore(0);
      setRunnerY(0);
      setObstacles([]);
    };
  }, [active]);

  if (!active) return null;

  const groundY = GAME_H - 36;

  return (
    <section
      className="overflow-hidden rounded-panel border-2 border-accent-dim/40 bg-gradient-to-b from-accent-soft/30 to-card shadow-cardSm"
      aria-label="분석 대기 미니 게임"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border bg-accent-soft/40 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Sparkles className="h-4 w-4 text-accent-dim" aria-hidden />
          분석이 진행되는 동안 잠깐 즐겨 보세요
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-mono font-bold tabular-nums text-accent-dim">
            {String(score).padStart(4, "0")}
          </span>
          <span className="flex items-center gap-1 text-fg-muted">
            <Trophy className="h-3.5 w-3.5 text-amber-500" aria-hidden />
            BEST {String(best).padStart(4, "0")}
          </span>
        </div>
      </div>

      <div className="relative flex items-center overflow-hidden border-b border-card-border bg-page-alt/60 py-2.5">
        <div className="animate-marquee whitespace-nowrap px-4 text-sm font-medium">
          {[...TICKER_MESSAGES, ...TICKER_MESSAGES].map((m, i) => (
            <span
              key={`${m}-${i}`}
              className={
                i % TICKER_MESSAGES.length === msgIndex
                  ? "text-accent-dim"
                  : "text-fg-muted"
              }
            >
              {m}
              <span className="mx-5 text-card-border">·</span>
            </span>
          ))}
        </div>
      </div>

      <div
        ref={areaRef}
        className="relative mx-auto w-full max-w-2xl cursor-pointer select-none"
        style={{ height: GAME_H }}
        role="button"
        tabIndex={0}
        aria-label="Space 또는 클릭으로 점프"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-8 h-24 rounded-full bg-accent/5 blur-2xl"
          aria-hidden
        />

        <div
          className="absolute inset-x-0 border-t-2 border-dashed border-accent-dim/25"
          style={{ top: groundY }}
        />

        <div
          className="absolute transition-none"
          style={{
            left: RUNNER_X,
            bottom: groundY - 4 + runnerY,
          }}
        >
          <Rabbit
            className={`h-9 w-9 text-accent-dim drop-shadow-sm ${running ? "animate-bounceRun" : ""}`}
            strokeWidth={2.25}
            aria-hidden
          />
        </div>

        {obstacles.map((o) => {
          const Icon = OBSTACLE_KINDS[o.kind] ?? Globe;
          return (
            <div
              key={o.id}
              className="absolute flex items-end justify-center"
              style={{
                left: o.x,
                bottom: groundY - 2,
                width: o.w,
              }}
            >
              <Icon
                className="h-8 w-8 text-fg-muted/80"
                strokeWidth={2}
                aria-hidden
              />
            </div>
          );
        })}

        <p className="absolute bottom-2 left-3 text-xs font-medium text-fg-muted">
          Space / 클릭 — 장애물을 넘기면 +10점
        </p>
      </div>
    </section>
  );
}
