import { isInVisionCone } from "@/lib/waitGame/vision";

export const FRAGMENT_RADIUS = 9;

const PICKUP_EMOJIS = ["💾", "📡", "🔗", "⚡", "🔐", "☁️", "📱", "🔍", "♿", "🌐"];

export class DataFragment {
  readonly id: number;
  readonly emoji: string;
  x: number;
  y: number;
  collected = false;
  popT = -1;
  discovered = false;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.emoji = PICKUP_EMOJIS[id % PICKUP_EMOJIS.length];
  }

  isVisible(
    px: number,
    py: number,
    facing: number,
    range: number,
    halfAngle: number,
  ): boolean {
    if (this.collected && this.popT < 0) return false;
    return isInVisionCone(this.x, this.y, px, py, facing, range, halfAngle);
  }

  tryCollect(
    px: number,
    py: number,
    playerRadius: number,
    facing: number,
    range: number,
    halfAngle: number,
  ): boolean {
    if (this.collected || this.popT >= 0) return false;
    if (!isInVisionCone(this.x, this.y, px, py, facing, range, halfAngle)) {
      return false;
    }
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

  render(ctx: CanvasRenderingContext2D, time: number) {
    if (this.collected && this.popT < 0) return;
    const { x, y } = this;

    if (this.popT >= 0) {
      const t = this.popT / 0.45;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.font = `bold ${18 + t * 14}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.emoji, x, y - t * 32);
      ctx.restore();
      return;
    }

    const pulse = 0.5 + Math.sin(time * 3 + this.id) * 0.5;
    const r = FRAGMENT_RADIUS + 2 + pulse;

    ctx.save();
    ctx.shadowColor = "rgba(56, 189, 248, 0.9)";
    ctx.shadowBlur = 14 + pulse * 6;

    ctx.fillStyle = "#0ea5e9";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f0f9ff";
    ctx.beginPath();
    ctx.arc(x, y, r - 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "bold 15px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, x, y + 1);
    ctx.restore();
  }
}
