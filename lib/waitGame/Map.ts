export const WORLD_W = 720;
export const WORLD_H = 440;

type WallRect = { x: number; y: number; w: number; h: number };

type BuildingPlan = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rooms: { x: number; y: number; w: number; h: number }[];
  doorSide: "n" | "s" | "e" | "w";
};

const BUILDINGS: BuildingPlan[] = [
  {
    id: "browser",
    label: "Browser",
    x: 24,
    y: 24,
    w: 200,
    h: 150,
    doorSide: "s",
    rooms: [
      { x: 36, y: 36, w: 80, h: 56 },
      { x: 124, y: 36, w: 88, h: 56 },
      { x: 36, y: 100, w: 176, h: 62 },
    ],
  },
  {
    id: "search",
    label: "Search",
    x: 260,
    y: 24,
    w: 200,
    h: 150,
    doorSide: "s",
    rooms: [
      { x: 272, y: 36, w: 176, h: 48 },
      { x: 272, y: 92, w: 84, h: 70 },
      { x: 364, y: 92, w: 84, h: 70 },
    ],
  },
  {
    id: "mobile",
    label: "Mobile",
    x: 496,
    y: 24,
    w: 200,
    h: 150,
    doorSide: "s",
    rooms: [
      { x: 508, y: 36, w: 88, h: 118 },
      { x: 604, y: 36, w: 80, h: 56 },
      { x: 604, y: 98, w: 80, h: 56 },
    ],
  },
  {
    id: "security",
    label: "Security",
    x: 24,
    y: 266,
    w: 200,
    h: 150,
    doorSide: "n",
    rooms: [
      { x: 36, y: 278, w: 176, h: 52 },
      { x: 36, y: 338, w: 84, h: 66 },
      { x: 128, y: 338, w: 84, h: 66 },
    ],
  },
  {
    id: "cloud",
    label: "Cloud",
    x: 260,
    y: 266,
    w: 200,
    h: 150,
    doorSide: "n",
    rooms: [
      { x: 272, y: 278, w: 56, h: 66 },
      { x: 336, y: 278, w: 56, h: 66 },
      { x: 400, y: 278, w: 48, h: 66 },
      { x: 272, y: 352, w: 176, h: 52 },
    ],
  },
  {
    id: "ux",
    label: "UX",
    x: 496,
    y: 266,
    w: 200,
    h: 150,
    doorSide: "n",
    rooms: [
      { x: 508, y: 278, w: 176, h: 52 },
      { x: 508, y: 338, w: 88, h: 66 },
      { x: 604, y: 338, w: 80, h: 66 },
    ],
  },
];

export class Map {
  readonly buildings = BUILDINGS;
  readonly walls: WallRect[];

  constructor() {
    this.walls = buildWallColliders(BUILDINGS);
  }

  /** Walkable spawn points (corridors + room centers). */
  getSpawnPoints(): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];

    for (const b of this.buildings) {
      for (const r of b.rooms) {
        pts.push({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
      }
    }

    const corridors = [
      { x: 220, y: 188, w: 280, h: 72 },
      { x: 188, y: 168, w: 48, h: 104 },
      { x: 484, y: 168, w: 48, h: 104 },
      { x: 330, y: 188, w: 60, h: 72 },
    ];
    for (const c of corridors) {
      for (let i = 0; i < 3; i++) {
        pts.push({
          x: c.x + 20 + Math.random() * (c.w - 40),
          y: c.y + 16 + Math.random() * (c.h - 32),
        });
      }
    }

    pts.push({ x: WORLD_W / 2, y: WORLD_H / 2 });
    return pts;
  }

  collidesCircle(cx: number, cy: number, r: number): boolean {
    for (const w of this.walls) {
      if (circleRectOverlap(cx, cy, r, w)) return true;
    }
    return false;
  }

  resolveCircle(px: number, py: number, r: number): { x: number; y: number } {
    let x = px;
    let y = py;
    for (let pass = 0; pass < 3; pass++) {
      for (const w of this.walls) {
        const resolved = pushCircleOutOfRect(x, y, r, w);
        x = resolved.x;
        y = resolved.y;
      }
    }
    return { x, y };
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#080d18";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    drawPaths(ctx);
    for (const b of this.buildings) {
      drawBuilding(ctx, b);
    }
    drawHubPlaza(ctx);
  }
}

function drawPaths(ctx: CanvasRenderingContext2D) {
  const paths: { x: number; y: number; w: number; h: number }[] = [
    { x: 16, y: 182, w: WORLD_W - 32, h: 76 },
    { x: 212, y: 170, w: 56, h: 100 },
    { x: 452, y: 170, w: 56, h: 100 },
    { x: 318, y: 198, w: 84, h: 44 },
  ];

  for (const p of paths) {
    ctx.fillStyle = "#1a2332";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "rgba(71, 85, 105, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  }

  ctx.strokeStyle = "rgba(51, 65, 85, 0.35)";
  ctx.setLineDash([6, 10]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(WORLD_W / 2, 182);
  ctx.lineTo(WORLD_W / 2, 258);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawHubPlaza(ctx: CanvasRenderingContext2D) {
  const cx = WORLD_W / 2;
  const cy = 218;
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 196, 113, 0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
  ctx.font = "600 9px Pretendard, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Hub", cx, cy + 3);
}

function drawBuilding(ctx: CanvasRenderingContext2D, b: BuildingPlan) {
  ctx.fillStyle = "#111c2e";
  ctx.fillRect(b.x, b.y, b.w, b.h);

  ctx.strokeStyle = "rgba(71, 85, 105, 0.7)";
  ctx.lineWidth = 3;
  ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);

  for (const r of b.rooms) {
    ctx.fillStyle = "#0d1524";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = "rgba(51, 65, 85, 0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  }

  drawDoorGap(ctx, b);

  ctx.fillStyle = "rgba(148, 163, 184, 0.45)";
  ctx.font = "600 9px Pretendard, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(b.label, b.x + b.w / 2, b.y + 12);
}

function drawDoorGap(ctx: CanvasRenderingContext2D, b: BuildingPlan) {
  const gap = 36;
  const mid = b.doorSide === "n" || b.doorSide === "s" ? b.x + b.w / 2 : b.y + b.h / 2;
  ctx.fillStyle = "#1a2332";
  if (b.doorSide === "s") {
    ctx.fillRect(mid - gap / 2, b.y + b.h - 4, gap, 8);
  } else if (b.doorSide === "n") {
    ctx.fillRect(mid - gap / 2, b.y - 4, gap, 8);
  } else if (b.doorSide === "e") {
    ctx.fillRect(b.x + b.w - 4, mid - gap / 2, 8, gap);
  } else {
    ctx.fillRect(b.x - 4, mid - gap / 2, 8, gap);
  }
}

function buildWallColliders(buildings: BuildingPlan[]): WallRect[] {
  const walls: WallRect[] = [];
  const t = 10;
  const gap = 40;

  for (const b of buildings) {
    const midX = b.x + b.w / 2;
    const midY = b.y + b.h / 2;

    if (b.doorSide === "s") {
      walls.push({ x: b.x, y: b.y, w: b.w, h: t });
      walls.push({ x: b.x, y: b.y, w: t, h: b.h });
      walls.push({ x: b.x + b.w - t, y: b.y, w: t, h: b.h });
      walls.push({ x: b.x, y: b.y + b.h - t, w: midX - gap / 2 - b.x, h: t });
      walls.push({
        x: midX + gap / 2,
        y: b.y + b.h - t,
        w: b.x + b.w - (midX + gap / 2),
        h: t,
      });
    } else if (b.doorSide === "n") {
      walls.push({ x: b.x, y: b.y + b.h - t, w: b.w, h: t });
      walls.push({ x: b.x, y: b.y, w: t, h: b.h });
      walls.push({ x: b.x + b.w - t, y: b.y, w: t, h: b.h });
      walls.push({ x: b.x, y: b.y, w: midX - gap / 2 - b.x, h: t });
      walls.push({
        x: midX + gap / 2,
        y: b.y,
        w: b.x + b.w - (midX + gap / 2),
        h: t,
      });
    }

    for (const r of b.rooms) {
      const rw = r.w;
      const rh = r.h;
      const doorW = Math.min(28, rw * 0.35);
      const rcx = r.x + rw / 2;
      walls.push({ x: r.x, y: r.y, w: rcx - doorW / 2 - r.x, h: 5 });
      walls.push({
        x: rcx + doorW / 2,
        y: r.y,
        w: r.x + rw - (rcx + doorW / 2),
        h: 5,
      });
      walls.push({ x: r.x, y: r.y + rh - 5, w: rw, h: 5 });
      walls.push({ x: r.x, y: r.y, w: 5, h: rh });
      walls.push({ x: r.x + rw - 5, y: r.y, w: 5, h: rh });
    }
  }

  return walls;
}

function circleRectOverlap(
  cx: number,
  cy: number,
  r: number,
  rect: WallRect,
): boolean {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
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
