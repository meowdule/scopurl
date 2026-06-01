"use client";

import { useEffect, useRef, useState } from "react";
import { Rabbit, Sparkles, Trophy, Zap } from "lucide-react";

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

/** Ground + flying obstacle emoji pools */
const GROUND_EMOJIS = ["🌐", "🔗", "🖥️", "📦", "☁️", "🧱"];
const FLYING_EMOJIS = ["🦅", "🐦", "🪁", "📡"];
const POWER_EMOJI = "⭐";

const RUNNER_X = 56;
const RUNNER_W = 34;
const RUNNER_H = 34;
const GAME_H = 220;

type Obstacle = {
  id: number;
  x: number;
  emojis: string[];
  w: number;
  scored: boolean;
  flying: boolean;
  stack: number;
};

type Props = {
  active: boolean;
};

export function AnalysisWaitExperience({ active }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [runnerY, setRunnerY] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [running, setRunning] = useState(true);
  const [hitFlash, setHitFlash] = useState(false);

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
    combo: 0,
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
        g.runnerVy = -12;
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

    const pickEmojis = (stack: number, pool: string[]) => {
      const out: string[] = [];
      for (let i = 0; i < stack; i++) {
        out.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      return out;
    };

    const spawnObstacle = (g: typeof gameRef.current) => {
      const flying = Math.random() < 0.22;
      const stack = flying ? 1 : 1 + Math.floor(Math.random() * 3);
      const pool = flying ? FLYING_EMOJIS : GROUND_EMOJIS;
      g.obstacles.push({
        id: g.nextId++,
        x: g.width + 24,
        emojis: pickEmojis(stack, pool),
        w: 30 + stack * 4,
        scored: false,
        flying,
        stack,
      });
    };

    const loop = () => {
      const g = gameRef.current;
      const el = areaRef.current;
      if (el) g.width = el.clientWidth;

      g.frame++;
      g.speed = Math.min(10, 4 + g.frame / 750);

      g.runnerVy += 0.55;
      g.runnerY += g.runnerVy;
      if (g.runnerY >= 0) {
        g.runnerY = 0;
        g.runnerVy = 0;
        g.jumping = false;
      }

      if (g.frame % 78 === 0) spawnObstacle(g);
      if (g.frame % 420 === 0 && g.obstacles.length < 4) {
        g.obstacles.push({
          id: g.nextId++,
          x: g.width + 40,
          emojis: [POWER_EMOJI],
          w: 28,
          scored: false,
          flying: false,
          stack: 1,
        });
      }

      const groundLine = GAME_H - 44;

      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const o = g.obstacles[i];
        o.x -= g.speed;

        if (!o.scored && o.x + o.w < RUNNER_X) {
          o.scored = true;
          if (o.emojis[0] === POWER_EMOJI) {
            g.score += 50;
            g.combo += 2;
          } else {
            g.combo += 1;
            const mult = Math.min(5, 1 + Math.floor(g.combo / 3));
            g.score += 10 * mult + (o.stack > 1 ? o.stack * 5 : 0);
          }
          setScore(g.score);
          setCombo(g.combo);
          const prevBest = Number(
            localStorage.getItem("scopurl-runner-best") || "0",
          );
          if (g.score > prevBest) {
            localStorage.setItem("scopurl-runner-best", String(g.score));
            setBest(g.score);
          }
        }

        const obsBottom = o.flying ? groundLine - 72 : groundLine - 2;
        const obsTop = obsBottom - o.stack * 26;
        const runnerBottom = groundLine - 4 + g.runnerY;
        const runnerTop = runnerBottom - RUNNER_H;

        const hit =
          o.x < RUNNER_X + RUNNER_W - 6 &&
          o.x + o.w > RUNNER_X + 4 &&
          runnerBottom > obsTop + 4 &&
          runnerTop < obsBottom - 2;

        if (hit && o.emojis[0] === POWER_EMOJI) {
          g.score += 30;
          setScore(g.score);
          g.obstacles.splice(i, 1);
          continue;
        }

        if (hit) {
          g.score = 0;
          g.combo = 0;
          setScore(0);
          setCombo(0);
          setHitFlash(true);
          setTimeout(() => setHitFlash(false), 320);
          g.obstacles = [];
          g.speed = 4;
          g.frame = 0;
          break;
        }

        if (o.x + o.w < -24) g.obstacles.splice(i, 1);
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
        combo: 0,
        width: 480,
      };
      setScore(0);
      setCombo(0);
      setRunnerY(0);
      setObstacles([]);
    };
  }, [active]);

  if (!active) return null;

  const groundY = GAME_H - 40;

  return (
    <section
      className={`mt-6 overflow-hidden rounded-panel border-2 border-accent-dim/40 bg-gradient-to-b from-accent-soft/30 to-card shadow-cardSm transition ${hitFlash ? "ring-2 ring-red-400/70" : ""}`}
      aria-label="분석 대기 미니 게임"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border bg-accent-soft/40 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Sparkles className="h-4 w-4 text-accent-dim" aria-hidden />
          분석 대기 중 — 잠깐 플레이해 보세요
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-mono font-bold tabular-nums text-accent-dim">
            {String(score).padStart(4, "0")}
          </span>
          {combo >= 3 && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              x{Math.min(5, 1 + Math.floor(combo / 3))}
            </span>
          )}
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
        className="relative mx-auto w-full max-w-2xl cursor-pointer select-none px-2 pb-3 pt-4"
        style={{ height: GAME_H }}
        role="button"
        tabIndex={0}
        aria-label="Space 또는 클릭으로 점프"
      >
        <div
          className="pointer-events-none absolute inset-x-4 top-10 h-24 rounded-full bg-accent/5 blur-2xl"
          aria-hidden
        />

        <div
          className="absolute inset-x-2 border-t-2 border-dashed border-accent-dim/30"
          style={{ top: groundY }}
        />

        <div
          className="absolute transition-none"
          style={{
            left: RUNNER_X,
            bottom: groundY - 6 + runnerY,
          }}
        >
          <div className="relative">
            <Rabbit
              className={`h-9 w-9 text-accent-dim drop-shadow-md ${running ? "animate-bounceRun" : ""}`}
              strokeWidth={2.25}
              aria-hidden
            />
            <span className="absolute -right-1 -top-1 text-base" aria-hidden>
              🐰
            </span>
          </div>
        </div>

        {obstacles.map((o) => {
          const bottom = o.flying ? groundY - 78 : groundY - 4;
          return (
            <div
              key={o.id}
              className="absolute flex flex-col-reverse items-center justify-end leading-none"
              style={{
                left: o.x,
                bottom,
                width: o.w,
              }}
            >
              {o.emojis.map((emoji, idx) => (
                <span
                  key={`${o.id}-${idx}`}
                  className="block text-2xl drop-shadow-sm"
                  style={{ marginBottom: idx > 0 ? -6 : 0 }}
                  aria-hidden
                >
                  {emoji}
                </span>
              ))}
            </div>
          );
        })}

        <p className="absolute bottom-2 left-4 text-xs font-medium text-fg-muted">
          Space / 클릭 점프 · 쌓인 이모지는 높이 점프 · ⭐ 보너스 · 충돌 시 점수 0
        </p>
      </div>
    </section>
  );
}
