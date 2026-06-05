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

  /** 0 outside cone, 1 at player — steep falloff with distance. */
  falloff(wx: number, wy: number): number {
    if (!this.contains(wx, wy)) return 0;
    const dist = Math.hypot(wx - this.px, wy - this.py);
    const t = dist / this.range;
    const distFade = Math.pow(1 - t, 1.95);
    const dx = wx - this.px;
    const dy = wy - this.py;
    const angleTo = Math.atan2(dy, dx);
    let diff = angleTo - this.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const edgeT = Math.abs(diff) / this.halfAngle;
    const edgeFade = 1 - Math.pow(edgeT, 3) * 0.35;
    return distFade * edgeFade;
  }

  /** Slightly wider/longer falloff for spotting collectibles (render only). */
  sightFalloff(wx: number, wy: number): number {
    const dx = wx - this.px;
    const dy = wy - this.py;
    const dist = Math.hypot(dx, dy);
    const sightRange = this.range * 1.1;
    if (dist > sightRange) return 0;
    const angleTo = Math.atan2(dy, dx);
    let diff = angleTo - this.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const sightAngle = this.halfAngle * 1.08;
    if (Math.abs(diff) > sightAngle) return 0;
    const t = dist / sightRange;
    const distFade = Math.pow(1 - t, 1.75);
    const edgeT = Math.abs(diff) / sightAngle;
    const edgeFade = 1 - Math.pow(edgeT, 3) * 0.28;
    return distFade * edgeFade;
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

  /** Strong distance darkening — near player bright, far edge very dark. */
  fillDistanceFade(ctx: CanvasRenderingContext2D) {
    const g = ctx.createRadialGradient(
      this.px,
      this.py,
      4,
      this.px,
      this.py,
      this.range,
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.18, "rgba(0,0,0,0.08)");
    g.addColorStop(0.4, "rgba(0,0,0,0.32)");
    g.addColorStop(0.62, "rgba(0,0,0,0.58)");
    g.addColorStop(0.82, "rgba(0,0,0,0.78)");
    g.addColorStop(1, "rgba(0,0,0,0.9)");
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

  /** Subtle warm core near player only. */
  fillSoftCone(ctx: CanvasRenderingContext2D, color: string) {
    const g = ctx.createRadialGradient(
      this.px,
      this.py,
      4,
      this.px,
      this.py,
      this.range * 0.35,
    );
    g.addColorStop(0, color);
    g.addColorStop(0.55, color.replace(/[\d.]+\)$/, "0.03)"));
    g.addColorStop(1, "rgba(0,0,0,0)");
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
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    this.tracePath(ctx);
    ctx.stroke();
    ctx.restore();
  }
}
