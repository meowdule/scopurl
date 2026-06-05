import { WORLD_H, WORLD_W } from "@/lib/waitGame/constants";

export const PLAYER_RADIUS = 10;

export class Player {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  facing = 0;
  private targetFacing = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.facing = 0;
    this.targetFacing = 0;
  }

  resetTo(x: number, y: number, facing = -Math.PI / 2) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.targetFacing = facing;
  }

  update(
    dt: number,
    keys: ReadonlySet<string>,
    stick?: { x: number; y: number } | null,
  ) {
    let ax = 0;
    let ay = 0;
    let moveScale = 1;

    const sx = stick?.x ?? 0;
    const sy = stick?.y ?? 0;
    const stickMag = Math.hypot(sx, sy);
    if (stickMag > 0.08) {
      ax = sx / stickMag;
      ay = sy / stickMag;
      moveScale = Math.min(1, stickMag);
    } else {
      if (keys.has("ArrowUp") || keys.has("KeyW")) ay -= 1;
      if (keys.has("ArrowDown") || keys.has("KeyS")) ay += 1;
      if (keys.has("ArrowLeft") || keys.has("KeyA")) ax -= 1;
      if (keys.has("ArrowRight") || keys.has("KeyD")) ax += 1;
    }

    if (ax !== 0 || ay !== 0) {
      const len = Math.hypot(ax, ay) || 1;
      ax /= len;
      ay /= len;
      this.targetFacing = Math.atan2(ay, ax);
    }

    let diff = this.targetFacing - this.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.facing += diff * Math.min(1, dt * 16);

    const accel = 0.42;
    const maxSpeed = 2.65;
    const friction = Math.pow(0.82, dt * 60);

    this.vx += ax * accel * dt * 60 * moveScale;
    this.vy += ay * accel * dt * 60 * moveScale;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    if (ax === 0 && ay === 0) {
      this.vx *= friction;
      this.vy *= friction;
      if (Math.hypot(this.vx, this.vy) < 0.04) {
        this.vx = 0;
        this.vy = 0;
      }
    }

    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;

    const pad = PLAYER_RADIUS + 4;
    this.x = Math.max(pad, Math.min(WORLD_W - pad, this.x));
    this.y = Math.max(pad, Math.min(WORLD_H - pad, this.y));
  }

  renderWorld(ctx: CanvasRenderingContext2D, pulse: number) {
    this.drawAvatar(ctx, this.x, this.y, pulse);
  }

  private drawAvatar(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    pulse: number,
  ) {
    ctx.save();
    ctx.translate(sx, sy);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.35)");
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS + 4 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.rotate(this.facing);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
