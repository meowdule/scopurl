export const FRAGMENT_RADIUS = 7;

export class DataFragment {
  readonly id: number;
  x: number;
  y: number;
  collected = false;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
  }

  tryCollect(px: number, py: number, playerRadius: number): boolean {
    if (this.collected) return false;
    const dist = Math.hypot(this.x - px, this.y - py);
    if (dist < FRAGMENT_RADIUS + playerRadius + 4) {
      this.collected = true;
      return true;
    }
    return false;
  }

  render(ctx: CanvasRenderingContext2D, time: number) {
    if (this.collected) return;

    const pulse = 0.5 + Math.sin(time * 3 + this.id) * 0.5;
    const { x, y } = this;

    const glow = ctx.createRadialGradient(x, y, 0, x, y, 18 + pulse * 4);
    glow.addColorStop(0, `rgba(125, 211, 252, ${0.45 + pulse * 0.2})`);
    glow.addColorStop(1, "rgba(125, 211, 252, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 18 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(186, 230, 253, ${0.85 + pulse * 0.15})`;
    ctx.beginPath();
    ctx.arc(x, y, FRAGMENT_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f0f9ff";
    ctx.beginPath();
    ctx.arc(x, y, FRAGMENT_RADIUS * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}
