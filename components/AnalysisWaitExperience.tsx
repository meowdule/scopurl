"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bird,
  Box,
  Cloud,
  Globe,
  Link2,
  Rabbit,
  Radio,
  Server,
  Sparkles,
  Star,
  Trophy,
  Zap,
  type LucideIcon,
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

const GROUND_ICONS = [Globe, Link2, Server, Box, Cloud] as const;
const FLYING_ICONS = [Bird, Radio, Cloud] as const;
const POWER_ICON = Star;

const RUNNER_X = 56;
const RUNNER_W = 36;
const RUNNER_H = 36;
const ICON_SIZE = 28;
const GAME_H = 200;
/** Distance from container bottom to ground line (px) */
const GROUND_BOTTOM = 40;
const FLY_LANE = 78;

type Obstacle = {
  id: number;
  x: number;
  icons: LucideIcon[];
  w: number;
  scored: boolean;
  flying: boolean;
  power: boolean;
};

type Props = {
  active: boolean;
};

function pickIcons(count: number, pool: readonly LucideIcon[]): LucideIcon[] {
  const out: LucideIcon[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return out;
}

function ObstacleStack({
  icons,
  power,
}: {
  icons: LucideIcon[];
  power?: boolean;
}) {
  return (
    <div className="flex flex-col-reverse items-center">
      {icons.map((Icon, idx) => (
        <Icon
          key={idx}
          className={`shrink-0 drop-shadow-sm ${
            power
              ? "h-7 w-7 text-amber-500"
              : "h-7 w-7 text-fg-muted/85"
          }`}
          strokeWidth={2.1}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function AnalysisWaitExperience({ active }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  /** Pixels above ground (0 = standing on ground) */
  const [airHeight, setAirHeight] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [running, setRunning] = useState(true);
  const [hitFlash, setHitFlash] = useState(false);

  const areaRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef({
    frame: 0,
    airHeight: 0,
    vy: 0,
    onGround: true,
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
      if (g.onGround) {
        g.vy = 13;
        g.onGround = false;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };

    const area = areaRef.current;
    window.addEventListener("keydown", onKey);
    area?.addEventListener("click", jump);

    const spawnObstacle = (g: typeof gameRef.current) => {
      const flying = Math.random() < 0.22;
      const stack = flying ? 1 : 1 + Math.floor(Math.random() * 3);
      g.obstacles.push({
        id: g.nextId++,
        x: g.width + 24,
        icons: pickIcons(stack, flying ? FLYING_ICONS : GROUND_ICONS),
        w: 32 + stack * 6,
        scored: false,
        flying,
        power: false,
      });
    };

    const loop = () => {
      const g = gameRef.current;
      const el = areaRef.current;
      if (el) g.width = el.clientWidth;

      g.frame++;
      g.speed = Math.min(10, 4 + g.frame / 750);

      if (!g.onGround) {
        g.vy -= 0.62;
        g.airHeight += g.vy;
        if (g.airHeight <= 0) {
          g.airHeight = 0;
          g.vy = 0;
          g.onGround = true;
        }
      }

      if (g.frame % 78 === 0) spawnObstacle(g);
      if (g.frame % 420 === 0 && g.obstacles.length < 4) {
        g.obstacles.push({
          id: g.nextId++,
          x: g.width + 40,
          icons: [POWER_ICON],
          w: 30,
          scored: false,
          flying: false,
          power: true,
        });
      }

      const runnerBottom = GROUND_BOTTOM + g.airHeight;
      const runnerTop = runnerBottom + RUNNER_H;

      for (let i = g.obstacles.length - 1; i >= 0; i--) {
        const o = g.obstacles[i];
        o.x -= g.speed;

        if (!o.scored && o.x + o.w < RUNNER_X) {
          o.scored = true;
          if (o.power) {
            g.score += 50;
            g.combo += 2;
          } else {
            g.combo += 1;
            const mult = Math.min(5, 1 + Math.floor(g.combo / 3));
            g.score += 10 * mult + (o.icons.length > 1 ? o.icons.length * 5 : 0);
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

        const stackH = o.icons.length * (ICON_SIZE - 4);
        const obsBottom = o.flying ? GROUND_BOTTOM + FLY_LANE : GROUND_BOTTOM;
        const obsTop = obsBottom + stackH;

        const hit =
          o.x < RUNNER_X + RUNNER_W - 4 &&
          o.x + o.w > RUNNER_X + 2 &&
          runnerBottom < obsTop - 2 &&
          runnerTop > obsBottom + 2;

        if (hit && o.power) {
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

      setAirHeight(g.airHeight);
      setObstacles([...g.obstacles]);
      setRunning(g.onGround && g.airHeight === 0);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKey);
      area?.removeEventListener("click", jump);
      gameRef.current = {
        frame: 0,
        airHeight: 0,
        vy: 0,
        onGround: true,
        speed: 4,
        obstacles: [],
        nextId: 0,
        score: 0,
        combo: 0,
        width: 480,
      };
      setScore(0);
      setCombo(0);
      setAirHeight(0);
      setObstacles([]);
    };
  }, [active]);

  if (!active) return null;

  return (
    <section
      className={`mb-5 overflow-hidden rounded-panel border-2 border-accent-dim/40 bg-gradient-to-b from-sky-50/80 via-card to-card shadow-cardSm transition dark:from-slate-800/40 ${hitFlash ? "ring-2 ring-red-400/70" : ""}`}
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
        className="relative mx-auto w-full max-w-2xl cursor-pointer select-none overflow-hidden"
        style={{ height: GAME_H }}
        role="button"
        tabIndex={0}
        aria-label="Space 또는 클릭으로 점프"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-t from-accent-soft/20 to-transparent"
          style={{ bottom: GROUND_BOTTOM }}
          aria-hidden
        />

        <div
          className="absolute inset-x-3 border-t-2 border-dashed border-accent-dim/35"
          style={{ bottom: GROUND_BOTTOM }}
        />

        <div
          className="absolute will-change-transform"
          style={{
            left: RUNNER_X,
            bottom: GROUND_BOTTOM + airHeight,
            width: RUNNER_W,
            height: RUNNER_H,
          }}
        >
          <Rabbit
            className={`h-9 w-9 text-accent-dim drop-shadow-md ${running ? "animate-bounceRun" : ""}`}
            strokeWidth={2.25}
            aria-hidden
          />
        </div>

        {obstacles.map((o) => (
          <div
            key={o.id}
            className="absolute flex items-end justify-center"
            style={{
              left: o.x,
              bottom: o.flying ? GROUND_BOTTOM + FLY_LANE : GROUND_BOTTOM,
              width: o.w,
            }}
          >
            <ObstacleStack icons={o.icons} power={o.power} />
          </div>
        ))}

        <p className="absolute bottom-1.5 left-3 right-3 text-center text-[11px] font-medium text-fg-muted">
          Space / 클릭 — 바닥에서 점프 · 쌓인 장애물은 높게 · Star 보너스 · 충돌
          시 점수 0
        </p>
      </div>
    </section>
  );
}
