export const PLAYER_RADIUS = 12;

export class Player {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  facing = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(
    dt: number,
    keys: ReadonlySet<string>,
    bounds: { w: number; h: number },
  ) {
    let ax = 0;
    let ay = 0;
    const up =
      keys.has("ArrowUp") || keys.has("KeyW") || keys.has("w") || keys.has("W");
    const down =
      keys.has("ArrowDown") ||
      keys.has("KeyS") ||
      keys.has("s") ||
      keys.has("S");
    const left =
      keys.has("ArrowLeft") ||
      keys.has("KeyA") ||
      keys.has("a") ||
      keys.has("A");
    const right =
      keys.has("ArrowRight") ||
      keys.has("KeyD") ||
      keys.has("d") ||
      keys.has("D");

    if (up) ay -= 1;
    if (down) ay += 1;
    if (left) ax -= 1;
    if (right) ax += 1;

    if (ax !== 0 || ay !== 0) {
      const len = Math.hypot(ax, ay) || 1;
      ax /= len;
      ay /= len;
      this.facing = Math.atan2(ay, ax);
    }

    const accel = 0.42;
    const maxSpeed = 2.65;
    const friction = Math.pow(0.82, dt * 60);

    this.vx += ax * accel * dt * 60;
    this.vy += ay * accel * dt * 60;

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
    this.x = Math.max(pad, Math.min(bounds.w - pad, this.x));
    this.y = Math.max(pad, Math.min(bounds.h - pad, this.y));
  }

  render(ctx: CanvasRenderingContext2D, pulse: number) {
    const { x, y, facing } = this;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(facing);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
    glow.addColorStop(0, "rgba(0, 196, 113, 0.35)");
    glow.addColorStop(1, "rgba(0, 196, 113, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#00c471";
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#a7f3d0";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#072b22";
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(167, 243, 208, 0.5)";
    ctx.lineWidth = 1.5 + pulse * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS + 3 + pulse * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /** Always drawn at screen center so the explorer stays visible above fog. */
  renderScreen(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    pulse: number,
  ) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.facing);

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS + 5, 0, Math.PI * 2);
    ctx.fill();

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    glow.addColorStop(0, "rgba(0, 196, 113, 0.5)");
    glow.addColorStop(1, "rgba(0, 196, 113, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#00c471";
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#064e3b";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(0, 196, 113, ${0.5 + pulse * 0.35})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_RADIUS + 6 + pulse * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 10px Pretendard, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("탐험가", sx, sy + PLAYER_RADIUS + 8);
  }
}
