import { WORLD_H, WORLD_W } from "@/lib/waitGame/constants";
import type { StageDefinition, WallRect, ZoneDraw } from "@/lib/waitGame/stageTypes";

export class StageMap {
  readonly def: StageDefinition;

  constructor(def: StageDefinition) {
    this.def = def;
  }

  get walls(): WallRect[] {
    return this.def.walls;
  }

  get exit() {
    return this.def.exit;
  }

  get theme() {
    return this.def.theme;
  }

  resolveCircle(px: number, py: number, r: number): { x: number; y: number } {
    let x = px;
    let y = py;
    for (let pass = 0; pass < 4; pass++) {
      for (const w of this.def.walls) {
        const resolved = pushCircleOutOfRect(x, y, r, w);
        x = resolved.x;
        y = resolved.y;
      }
    }
    return { x, y };
  }

  render(ctx: CanvasRenderingContext2D, mode: "dim" | "bright") {
    const bright = mode === "bright";
    const t = this.def.theme;

    ctx.fillStyle = bright ? t.bg : shade(t.bg, 0.55);
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    for (const z of this.def.zones) {
      drawZone(ctx, z, bright, t);
    }
  }

  renderExit(
    ctx: CanvasRenderingContext2D,
    active: boolean,
    pulse: number,
  ) {
    const { x, y, r } = this.def.exit;
    const t = this.def.theme;
    const glow = active ? 1 : 0.35;

    ctx.save();
    const grd = ctx.createRadialGradient(x, y, 4, x, y, r + 12 + pulse * 6);
    grd.addColorStop(0, hexAlpha(t.exitGlow, 0.5 * glow));
    grd.addColorStop(1, hexAlpha(t.exitGlow, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r + 14 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = active ? t.exitGlow : hexAlpha(t.exitGlow, 0.4);
    ctx.lineWidth = active ? 3 : 2;
    ctx.setLineDash(active ? [] : [6, 4]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = active ? "#fff" : hexAlpha("#fff", 0.5);
    ctx.font = `700 ${active ? 11 : 10}px Pretendard, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(active ? "EXIT" : "출구", x, y);
    ctx.restore();
  }

  renderMinimap(
    ctx: CanvasRenderingContext2D,
    boxX: number,
    boxY: number,
    boxW: number,
    boxH: number,
    playerX: number,
    playerY: number,
    stageIndex: number,
  ) {
    const scale = Math.min(boxW / WORLD_W, boxH / WORLD_H);
    const ox = boxX + (boxW - WORLD_W * scale) / 2;
    const oy = boxY + (boxH - WORLD_H * scale) / 2;

    ctx.save();
    ctx.fillStyle = "rgba(8, 12, 22, 0.92)";
    ctx.strokeStyle = "rgba(100, 116, 139, 0.6)";
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(boxX + 3, boxY + 3, boxW - 6, boxH - 6, 4);
    ctx.clip();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.9;
    this.render(ctx, "bright");

    const px = playerX * scale + ox;
    const py = playerY * scale + oy;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#00c471";
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 9px Pretendard, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Stage ${stageIndex + 1}`, boxX + 6, boxY + 12);
    ctx.restore();
  }
}

function drawZone(
  ctx: CanvasRenderingContext2D,
  z: ZoneDraw,
  bright: boolean,
  theme: StageDefinition["theme"],
) {
  ctx.fillStyle = bright ? z.fill : shade(z.fill, 0.6);
  const stroke = z.stroke ?? theme.pathStroke;

  if (z.kind === "circle" || z.kind === "ring") {
    const r = z.r ?? 20;
    ctx.beginPath();
    ctx.arc(z.x, z.y, r, 0, Math.PI * 2);
    if (z.kind === "ring") {
      ctx.fill();
      ctx.strokeStyle = bright ? stroke : hexAlpha(stroke, 0.5);
      ctx.lineWidth = bright ? 2 : 1;
      ctx.stroke();
    } else {
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = bright ? 2 : 1;
        ctx.stroke();
      }
    }
  } else if (z.kind === "roundRect") {
    const w = z.w ?? 40;
    const h = z.h ?? 30;
    ctx.beginPath();
    ctx.roundRect(z.x, z.y, w, h, 8);
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = bright ? 2 : 1;
      ctx.stroke();
    }
  } else {
    ctx.fillRect(z.x, z.y, z.w ?? 40, z.h ?? 30);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = bright ? 1.5 : 1;
      ctx.strokeRect(z.x, z.y, z.w ?? 40, z.h ?? 30);
    }
  }

  if (z.label && bright) {
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 10px Pretendard, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cx =
      z.kind === "circle" || z.kind === "ring"
        ? z.x
        : z.x + (z.w ?? 40) / 2;
    const cy =
      z.kind === "circle" || z.kind === "ring"
        ? z.y
        : z.y + (z.h ?? 30) / 2;
    ctx.fillText(z.label, cx, cy);
  }
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

function shade(hex: string, factor: number): string {
  return hex;
}

function hexAlpha(color: string, alpha: number): string {
  if (color.startsWith("rgba")) return color;
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${color}${a}`;
}
