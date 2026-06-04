import { isInVisionCone } from "@/lib/waitGame/vision";

export const FRAGMENT_RADIUS = 7;

const PICKUP_EMOJIS = ["💾", "📡", "🔗", "⚡", "🔐", "☁️", "📱", "🔍", "♿", "🌐"];

export class DataFragment {
  readonly id: number;
  readonly emoji: string;
  x: number;
  y: number;
  collected = false;
  /** Pop animation after pickup (still drawn briefly). */
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

    if (
      !isInVisionCone(this.x, this.y, px, py, facing, range, halfAngle)
    ) {
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
      const scale = 1 + t * 1.8;
      const alpha = 1 - t;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${14 + t * 10}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.emoji, x, y - t * 28);
      ctx.restore();
      return;
    }

    const pulse = 0.5 + Math.sin(time * 3 + this.id) * 0.5;

    const glow = ctx.createRadialGradient(x, y, 0, x, y, 16 + pulse * 3);
    glow.addColorStop(0, `rgba(125, 211, 252, ${0.5 + pulse * 0.25})`);
    glow.addColorStop(1, "rgba(125, 211, 252, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 16 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(186, 230, 253, ${0.9})`;
    ctx.beginPath();
    ctx.arc(x, y, FRAGMENT_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, x, y + 0.5);
  }
}
