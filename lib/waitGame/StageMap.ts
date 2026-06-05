import { FRAGMENTS_PER_STAGE } from "@/lib/waitGame/constants";
import {
  drawBlueprintGrid,
  drawBlueprintMaze,
  isWorldReachable,
  normalizeMaze,
  parseMazeGrid,
} from "@/lib/waitGame/mazeGrid";
import { WORLD_H, WORLD_W } from "@/lib/waitGame/constants";
import type { StageDefinition, WallRect } from "@/lib/waitGame/stageTypes";

export class StageMap {
  readonly def: StageDefinition;
  readonly maze: string[];
  readonly walls: WallRect[];
  readonly playerStart: { x: number; y: number };
  readonly exit: { x: number; y: number; r: number };
  readonly spawnPoints: { x: number; y: number }[];

  constructor(def: StageDefinition) {
    this.def = def;
    this.maze = normalizeMaze(def.maze);
    const parsed = parseMazeGrid(this.maze);
    this.walls = parsed.walls;
    this.playerStart = parsed.playerStart;
    this.exit = parsed.exit;
    this.spawnPoints = buildSpawnList(
      parsed.fragmentCells,
      parsed.walkableCells,
      parsed.reachableKeys,
      parsed.playerStart,
      parsed.exit,
      def.extraSpawns,
    );
  }

  get theme() {
    return this.def.theme;
  }

  resolveCircle(px: number, py: number, r: number): { x: number; y: number } {
    let x = px;
    let y = py;
    for (let pass = 0; pass < 4; pass++) {
      for (const w of this.walls) {
        const resolved = pushCircleOutOfRect(x, y, r, w);
        x = resolved.x;
        y = resolved.y;
      }
    }
    return { x, y };
  }

  render(ctx: CanvasRenderingContext2D) {
    const t = this.def.theme;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    drawBlueprintGrid(ctx, t.grid);
    drawBlueprintMaze(ctx, this.maze, t.wallStroke, t.wallGlow);
    this.renderDecor(ctx);
  }

  private renderDecor(ctx: CanvasRenderingContext2D) {
    const t = this.def.theme;
    ctx.save();
    ctx.fillStyle = t.accent;
    ctx.globalAlpha = 0.3;
    const nodes = [
      [100, 80],
      [360, 120],
      [620, 80],
      [180, 280],
      [540, 280],
    ];
    for (const [nx, ny] of nodes) {
      ctx.beginPath();
      ctx.arc(nx, ny, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  renderExit(
    ctx: CanvasRenderingContext2D,
    active: boolean,
    pulse: number,
  ) {
    const { x, y, r } = this.exit;
    const t = this.def.theme;
    const color = active ? t.exitActive : t.exitGlow;
    const w = r * 1.6;
    const h = r * 1.2;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = active ? 18 + pulse * 8 : 8;
    ctx.fillStyle = active ? hexAlpha(color, 0.35) : hexAlpha(color, 0.12);
    ctx.strokeStyle = color;
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.setLineDash(active ? [] : [5, 4]);
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.shadowBlur = 0;
    ctx.fillStyle = active ? "#fff" : hexAlpha("#fff", 0.5);
    ctx.font = `700 ${active ? 11 : 10}px Pretendard, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(active ? "EXIT ▶" : "출구", x, y);

    if (active) {
      ctx.fillStyle = hexAlpha(color, 0.9);
      ctx.font = "600 8px Pretendard, system-ui, sans-serif";
      ctx.fillText("진입", x, y + h / 2 + 10);
    }
    ctx.restore();
  }
}

function buildSpawnList(
  fragmentCells: { x: number; y: number }[],
  walkable: { x: number; y: number }[],
  reachable: Set<string>,
  playerStart: { x: number; y: number },
  exit: { x: number; y: number },
  extra?: { x: number; y: number }[],
): { x: number; y: number }[] {
  const reachableWalkable = walkable.filter((p) =>
    isWorldReachable(p.x, p.y, reachable),
  );

  const tooClose = (p: { x: number; y: number }) =>
    Math.hypot(p.x - playerStart.x, p.y - playerStart.y) < 50 ||
    Math.hypot(p.x - exit.x, p.y - exit.y) < 40;

  const seen = new Set<string>();
  const pool: { x: number; y: number }[] = [];

  const add = (pts: { x: number; y: number }[]) => {
    for (const p of pts) {
      if (!isWorldReachable(p.x, p.y, reachable)) continue;
      if (tooClose(p)) continue;
      const key = `${Math.round(p.x)},${Math.round(p.y)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pool.push(p);
    }
  };

  add(fragmentCells);
  add(extra ?? []);

  if (pool.length < FRAGMENTS_PER_STAGE) {
    const sorted = [...reachableWalkable]
      .filter((p) => !tooClose(p))
      .sort(
        (a, b) =>
          Math.hypot(a.x - playerStart.x, a.y - playerStart.y) -
          Math.hypot(b.x - playerStart.x, b.y - playerStart.y),
      );
    const step = Math.max(1, Math.floor(sorted.length / FRAGMENTS_PER_STAGE));
    const spread: { x: number; y: number }[] = [];
    for (let i = step; i < sorted.length; i += step) {
      spread.push(sorted[i]);
    }
    add(spread.sort(() => Math.random() - 0.5));
  }

  if (pool.length < FRAGMENTS_PER_STAGE) {
    add(
      [...reachableWalkable]
        .filter((p) => !tooClose(p))
        .sort(() => Math.random() - 0.5),
    );
  }

  return pool.slice(0, Math.max(FRAGMENTS_PER_STAGE, pool.length));
}

function pushCircleOutOfRect(
  cx: number,
  cy: number,
  r: number,
  rect: WallRect,
): { x: number; y: number } {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r || d2 === 0) return { x: cx, y: cy };
  const d = Math.sqrt(d2);
  const push = r - d + 0.5;
  return { x: cx + (dx / d) * push, y: cy + (dy / d) * push };
}

function hexAlpha(color: string, alpha: number): string {
  if (color.startsWith("rgba")) return color;
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${color}${a}`;
}
