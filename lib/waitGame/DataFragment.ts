import type { VisionCone } from "@/lib/waitGame/VisionCone";

export const FRAGMENT_RADIUS = 9;

const MEMORY_EMOJIS = ["✨", "💫", "🔮", "📜", "🌟", "💠", "🪶", "🫧", "⭐", "🌙"];

export class DataFragment {
  readonly id: number;
  readonly emoji: string;
  x: number;
  y: number;
  collected = false;
  popT = -1;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.emoji = MEMORY_EMOJIS[id % MEMORY_EMOJIS.length];
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

  render(ctx: CanvasRenderingContext2D, time: number, vision: VisionCone) {
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

    const alpha = vision.falloff(x, y);
    if (alpha < 0.06) return;

    const pulse = 0.5 + Math.sin(time * 3 + this.id) * 0.5;
    const r = FRAGMENT_RADIUS + 2 + pulse;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = "rgba(250, 204, 21, 0.95)";
    ctx.shadowBlur = 16 + pulse * 8;

    ctx.fillStyle = "#fbbf24";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = "bold 15px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, x, y + 1);
    ctx.restore();
  }
}
