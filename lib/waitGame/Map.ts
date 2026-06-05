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
  doorSide: "n" | "s";
  floorTint: string;
};

/** Open-floor buildings — collision only on outer shell (no inner room walls). */
const BUILDINGS: BuildingPlan[] = [
  {
    id: "browser",
    label: "Browser",
    x: 20,
    y: 20,
    w: 218,
    h: 158,
    doorSide: "s",
    floorTint: "#1e3a5f",
  },
  {
    id: "search",
    label: "Search",
    x: 252,
    y: 20,
    w: 218,
    h: 158,
    doorSide: "s",
    floorTint: "#134e4a",
  },
  {
    id: "mobile",
    label: "Mobile",
    x: 484,
    y: 20,
    w: 216,
    h: 158,
    doorSide: "s",
    floorTint: "#312e81",
  },
  {
    id: "security",
    label: "Security",
    x: 20,
    y: 262,
    w: 218,
    h: 158,
    doorSide: "n",
    floorTint: "#4c1d3d",
  },
  {
    id: "cloud",
    label: "Cloud",
    x: 252,
    y: 262,
    w: 218,
    h: 158,
    doorSide: "n",
    floorTint: "#1e293b",
  },
  {
    id: "ux",
    label: "UX",
    x: 484,
    y: 262,
    w: 216,
    h: 158,
    doorSide: "n",
    floorTint: "#14532d",
  },
];

const CORRIDORS = [
  { x: 16, y: 184, w: WORLD_W - 32, h: 72, label: "메인 복도" },
  { x: 232, y: 172, w: 28, h: 96 },
  { x: 464, y: 172, w: 28, h: 96 },
] as const;

export class Map {
  readonly buildings = BUILDINGS;
  readonly walls: WallRect[];

  constructor() {
    this.walls = buildOuterWallsOnly(BUILDINGS);
  }

  getSpawnPoints(): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [{ x: WORLD_W / 2, y: 220 }];

    for (const b of this.buildings) {
      const cx = b.x + b.w / 2;
      const cy =
        b.doorSide === "s" ? b.y + b.h * 0.55 : b.y + b.h * 0.42;
      pts.push({ x: cx, y: cy });
      pts.push({ x: cx - b.w * 0.22, y: cy });
      pts.push({ x: cx + b.w * 0.22, y: cy });
    }

    for (const c of CORRIDORS) {
      for (let i = 0; i < 2; i++) {
        pts.push({
          x: c.x + 24 + Math.random() * (c.w - 48),
          y: c.y + 20 + Math.random() * (c.h - 40),
        });
      }
    }

    return pts;
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

  render(ctx: CanvasRenderingContext2D, mode: "dim" | "bright" = "bright") {
    const bright = mode === "bright";

    ctx.fillStyle = bright ? "#1e293b" : "#0c1018";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    drawMapBorder(ctx, bright);
    drawCorridors(ctx, bright);

    for (const b of this.buildings) {
      drawBuilding(ctx, b, bright);
    }

    drawHubPlaza(ctx, bright);
    drawConnectorLines(ctx, bright);
  }

  renderMinimap(
    ctx: CanvasRenderingContext2D,
    boxX: number,
    boxY: number,
    boxW: number,
    boxH: number,
    playerX: number,
    playerY: number,
    facing: number,
  ) {
    const scale = Math.min(boxW / WORLD_W, boxH / WORLD_H);
    const ox = boxX + (boxW - WORLD_W * scale) / 2;
    const oy = boxY + (boxH - WORLD_H * scale) / 2;

    ctx.save();
    ctx.fillStyle = "rgba(8, 12, 22, 0.92)";
    ctx.strokeStyle = "rgba(100, 116, 139, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(boxX + 3, boxY + 3, boxW - 6, boxH - 6, 4);
    ctx.clip();

    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.95;
    this.render(ctx, "bright");

    const px = playerX * scale + ox;
    const py = playerY * scale + oy;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#00c471";
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "rgba(226, 232, 240, 0.9)";
    ctx.font = "600 9px Pretendard, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("구조도", boxX + 6, boxY + 12);
    ctx.restore();
  }
}

function drawMapBorder(ctx: CanvasRenderingContext2D, bright: boolean) {
  ctx.strokeStyle = bright ? "#94a3b8" : "rgba(71, 85, 105, 0.35)";
  ctx.lineWidth = bright ? 2.5 : 1;
  ctx.strokeRect(10, 10, WORLD_W - 20, WORLD_H - 20);
}

const BUILDING_LABELS_KO: Record<string, string> = {
  browser: "브라우저",
  search: "검색",
  mobile: "모바일",
  security: "보안",
  cloud: "클라우드",
  ux: "UX",
};

function drawCorridors(ctx: CanvasRenderingContext2D, bright: boolean) {
  for (const c of CORRIDORS) {
    ctx.fillStyle = bright ? "#475569" : "#1a2332";
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = bright ? "#cbd5e1" : "rgba(71, 85, 105, 0.45)";
    ctx.lineWidth = bright ? 2 : 1;
    ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
    if ("label" in c && c.label && bright) {
      ctx.fillStyle = "#f8fafc";
      ctx.font = "700 11px Pretendard, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2);
    }
  }
}

function drawConnectorLines(ctx: CanvasRenderingContext2D, bright: boolean) {
  if (!bright) return;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
  ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1;
  for (const b of BUILDINGS) {
    const cx = b.x + b.w / 2;
    const doorY = b.doorSide === "s" ? b.y + b.h : b.y;
    ctx.beginPath();
    ctx.moveTo(cx, doorY);
    ctx.lineTo(cx, 220);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawHubPlaza(ctx: CanvasRenderingContext2D, bright: boolean) {
  const cx = WORLD_W / 2;
  const cy = 220;
  ctx.fillStyle = bright ? "#334155" : "rgba(15, 23, 42, 0.9)";
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = bright ? "#00c471" : "rgba(0, 196, 113, 0.35)";
  ctx.lineWidth = bright ? 3 : 2;
  ctx.stroke();
  ctx.fillStyle = bright ? "#ffffff" : "rgba(148, 163, 184, 0.5)";
  ctx.font = "700 12px Pretendard, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("허브", cx, cy + 1);
}

function drawBuilding(ctx: CanvasRenderingContext2D, b: BuildingPlan, bright: boolean) {
  const pad = 12;
  const inner = {
    x: b.x + pad,
    y: b.y + pad,
    w: b.w - pad * 2,
    h: b.h - pad * 2,
  };

  ctx.fillStyle = bright ? b.floorTint : "#111c2e";
  ctx.fillRect(b.x, b.y, b.w, b.h);

  if (bright) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  }

  ctx.strokeStyle = bright ? "#e2e8f0" : "rgba(71, 85, 105, 0.7)";
  ctx.lineWidth = bright ? 3.5 : 3;
  ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);

  drawDoorGap(ctx, b, bright);

  const label = BUILDING_LABELS_KO[b.id] ?? b.label;
  ctx.fillStyle = bright ? "#ffffff" : "rgba(148, 163, 184, 0.45)";
  ctx.font = `700 ${bright ? 12 : 9}px Pretendard, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, b.x + b.w / 2, b.y + (b.doorSide === "s" ? 18 : b.h - 18));
}

function drawDoorGap(ctx: CanvasRenderingContext2D, b: BuildingPlan, bright: boolean) {
  const gap = 48;
  const mid = b.x + b.w / 2;
  ctx.fillStyle = bright ? "#64748b" : "#1a2332";
  if (b.doorSide === "s") {
    ctx.fillRect(mid - gap / 2, b.y + b.h - 6, gap, 10);
  } else {
    ctx.fillRect(mid - gap / 2, b.y - 4, gap, 10);
  }
}

/** Outer perimeter only — wide door gaps, no interior partitions. */
function buildOuterWallsOnly(buildings: BuildingPlan[]): WallRect[] {
  const walls: WallRect[] = [];
  const t = 8;
  const gap = 52;

  for (const b of buildings) {
    const midX = b.x + b.w / 2;

    walls.push({ x: b.x, y: b.y, w: b.w, h: t });
    walls.push({ x: b.x, y: b.y, w: t, h: b.h });
    walls.push({ x: b.x + b.w - t, y: b.y, w: t, h: b.h });

    if (b.doorSide === "s") {
      walls.push({ x: b.x, y: b.y + b.h - t, w: midX - gap / 2 - b.x, h: t });
      walls.push({
        x: midX + gap / 2,
        y: b.y + b.h - t,
        w: b.x + b.w - (midX + gap / 2),
        h: t,
      });
    } else {
      walls.push({ x: b.x, y: b.y, w: midX - gap / 2 - b.x, h: t });
      walls.push({
        x: midX + gap / 2,
        y: b.y,
        w: b.x + b.w - (midX + gap / 2),
        h: t,
      });
      walls.push({ x: b.x, y: b.y + b.h - t, w: b.w, h: t });
    }
  }

  return walls;
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
