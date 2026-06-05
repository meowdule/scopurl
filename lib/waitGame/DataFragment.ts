import type { VisionCone } from "@/lib/waitGame/VisionCone";

export const FRAGMENT_RADIUS = 9;

export class DataFragment {
  readonly id: number;
  x: number;
  y: number;
  collected = false;
  popT = -1;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
  }

  tryCollect(
    px: number,
    py: number,
    playerRadius: number,
    vision: VisionCone,
  ): boolean {
    if (this.collected || this.popT >= 0) return false;
    if (!vision.contains(this.x, this.y)) return false;
    const dist = Math.hypot(this.x - px, this.y - py);
    if (dist < FRAGMENT_RADIUS + playerRadius + 6) {
      this.collected = true;
      this.popT = 0;
      return true;
    }
    return false;
  }

  updateAnim(dt: number) {
    if (this.popT >= 0) {
      this.popT += dt;
      if (this.popT > 0.45) this.popT = -1;
    }
  }

  private drawDiamond(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
  ) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.85, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.85, y);
    ctx.closePath();
  }

  render(ctx: CanvasRenderingContext2D, time: number, vision: VisionCone) {
    if (this.collected && this.popT < 0) return;
    const { x, y } = this;

    if (this.popT >= 0) {
      const t = this.popT / 0.45;
      const r = FRAGMENT_RADIUS + t * 10;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = "#7dd3fc";
      this.drawDiamond(ctx, x, y - t * 28, r);
      ctx.fill();
      ctx.restore();
      return;
    }

    const alpha = vision.falloff(x, y);
    if (alpha < 0.06) return;

    const pulse = 0.5 + Math.sin(time * 3 + this.id) * 0.5;
    const r = FRAGMENT_RADIUS + 2 + pulse * 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "rgba(56, 189, 248, 0.95)";
    ctx.shadowBlur = 14 + pulse * 8;

    this.drawDiamond(ctx, x, y, r + 4);
    ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
    ctx.fill();

    this.drawDiamond(ctx, x, y, r);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f0f9ff";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
