import { FRAGMENTS_PER_STAGE } from "@/lib/waitGame/constants";
import {
  MIN_FRAGMENT_SPREAD,
  pickSpreadPoints,
} from "@/lib/waitGame/spawnSpread";
import {
  drawBlueprintGrid,
  drawBlueprintMaze,
  isWorldReachable,
  parseMazeGrid,
} from "@/lib/waitGame/mazeGrid";
import { generateRoomMaze } from "@/lib/waitGame/roomGenerator";
import { WORLD_H, WORLD_W } from "@/lib/waitGame/constants";
import type { StageDefinition, WallRect } from "@/lib/waitGame/stageTypes";

export class StageMap {
  readonly def: StageDefinition;
  readonly maze: string[];
  readonly walls: WallRect[];
  readonly playerStart: { x: number; y: number };
  readonly exit: { x: number; y: number; r: number };
  readonly spawnPoints: { x: number; y: number }[];

  constructor(def: StageDefinition, seed: number, stageIndex: number) {
    this.def = def;
    this.maze = generateRoomMaze(seed, stageIndex, def.generator);
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
    ctx.globalAlpha = 0.25;
    for (const [nx, ny] of [
      [90, 70],
      [280, 110],
      [440, 90],
      [580, 200],
      [200, 300],
      [500, 320],
    ]) {
      ctx.beginPath();
      ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  renderExit(
    ctx: CanvasRenderingContext2D,
    active: boolean,
    pulse: number,
    visionFalloff = 1,
  ) {
    const { x, y } = this.exit;
    const t = this.def.theme;
    const color = active ? t.exitActive : t.exitGlow;
    const alpha = Math.max(0.25, visionFalloff);

    ctx.save();
    ctx.globalAlpha = alpha;

    const glowR = 28 + pulse * 6;
    const grd = ctx.createRadialGradient(x, y, 4, x, y, glowR);
    grd.addColorStop(0, hexAlpha(color, active ? 0.5 : 0.2));
    grd.addColorStop(1, hexAlpha(color, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = color;
    ctx.shadowBlur = active ? 16 + pulse * 10 : 6;
    ctx.strokeStyle = color;
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.globalAlpha = alpha * (active ? 1 : 0.65);

    const fw = 22;
    const fh = 28;
    ctx.beginPath();
    ctx.roundRect(x - fw / 2, y - fh / 2 - 2, fw, fh, 3);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y - fh / 2 - 2, fw / 2, Math.PI, 0);
    ctx.stroke();

    ctx.shadowBlur = 0;
    const portal = ctx.createRadialGradient(x, y, 2, x, y, 12);
    portal.addColorStop(0, active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)");
    portal.addColorStop(0.5, hexAlpha(color, active ? 0.45 : 0.15));
    portal.addColorStop(1, hexAlpha(color, 0));
    ctx.fillStyle = portal;
    ctx.beginPath();
    ctx.arc(x, y, 12 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = active ? "#fff" : hexAlpha("#fff", 0.5);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 5, y - 6);
    ctx.lineTo(x - 5, y + 8);
    ctx.moveTo(x + 5, y - 6);
    ctx.lineTo(x + 5, y + 8);
    ctx.stroke();

    ctx.fillStyle = active ? "#fff" : hexAlpha("#fff", 0.6);
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 1);
    ctx.lineTo(x - 4, y - 3);
    ctx.lineTo(x - 4, y + 5);
    ctx.closePath();
    ctx.fill();

    if (active) {
      ctx.fillStyle = hexAlpha(color, 0.95);
      ctx.font = "700 8px Pretendard, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("EXIT", x, y + fh / 2 + 6);
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
    add(spread);
  }

  if (pool.length < FRAGMENTS_PER_STAGE) {
    add([...reachableWalkable].filter((p) => !tooClose(p)));
  }

  return pickSpreadPoints(
    pool,
    Math.max(FRAGMENTS_PER_STAGE, pool.length),
    MIN_FRAGMENT_SPREAD,
  );
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
  if (color.startsWith("rgba")) {
    return color.replace(/[\d.]+\)$/, `${alpha})`);
  }
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${color}${a}`;
}
