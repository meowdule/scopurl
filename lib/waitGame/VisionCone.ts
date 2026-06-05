import { VISION_HALF_ANGLE, VISION_RANGE } from "@/lib/waitGame/constants";

/** Single source of truth for FOV (world space, player-centered). */
export class VisionCone {
  readonly range = VISION_RANGE;
  readonly halfAngle = VISION_HALF_ANGLE;

  constructor(
    public px: number,
    public py: number,
    public facing: number,
  ) {}

  contains(wx: number, wy: number): boolean {
    const dx = wx - this.px;
    const dy = wy - this.py;
    const dist = Math.hypot(dx, dy);
    if (dist > this.range) return false;
    const angleTo = Math.atan2(dy, dx);
    let diff = angleTo - this.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff) <= this.halfAngle;
  }

  /** 0 outside cone, 1 at player, smooth quadratic falloff by distance. */
  falloff(wx: number, wy: number): number {
    if (!this.contains(wx, wy)) return 0;
    const dist = Math.hypot(wx - this.px, wy - this.py);
    const t = dist / this.range;
    return 1 - t * t * 0.68;
  }

  tracePath(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.moveTo(this.px, this.py);
    ctx.arc(
      this.px,
      this.py,
      this.range,
      this.facing - this.halfAngle,
      this.facing + this.halfAngle,
    );
    ctx.closePath();
  }

  clip(ctx: CanvasRenderingContext2D) {
    this.tracePath(ctx);
    ctx.clip();
  }

  /** Fog outside cone (call inside translated world space). */
  fillFogOutside(
    ctx: CanvasRenderingContext2D,
    worldW: number,
    worldH: number,
    color: string,
  ) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(0, 0, worldW, worldH);
    this.tracePath(ctx);
    ctx.fill("evenodd");
    ctx.restore();
  }

  /** Distance fade inside cone (world space). */
  fillDistanceFade(ctx: CanvasRenderingContext2D, inner = 0.08) {
    const g = ctx.createRadialGradient(
      this.px,
      this.py,
      inner,
      this.px,
      this.py,
      this.range,
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.35, "rgba(0,0,0,0)");
    g.addColorStop(0.62, "rgba(0,0,0,0.12)");
    g.addColorStop(0.82, "rgba(0,0,0,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0.52)");
    ctx.save();
    this.tracePath(ctx);
    ctx.clip();
    ctx.fillStyle = g;
    ctx.fillRect(
      this.px - this.range,
      this.py - this.range,
      this.range * 2,
      this.range * 2,
    );
    ctx.restore();
  }

  strokeRim(ctx: CanvasRenderingContext2D, color: string) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    this.tracePath(ctx);
    ctx.stroke();
    ctx.restore();
  }
}
