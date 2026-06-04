export type ZoneDef = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke: string;
};

export const WORLD_W = 660;
export const WORLD_H = 400;

export class Map {
  readonly zones: ZoneDef[];

  constructor() {
    const cols = 3;
    const rows = 2;
    const pad = 10;
    const gap = 8;
    const cellW = (WORLD_W - pad * 2 - gap * (cols - 1)) / cols;
    const cellH = (WORLD_H - pad * 2 - gap * (rows - 1)) / rows;

    const defs: Omit<ZoneDef, "x" | "y" | "w" | "h">[] = [
      {
        id: "browser",
        label: "Browser Zone",
        fill: "rgba(30, 58, 95, 0.55)",
        stroke: "rgba(96, 165, 250, 0.35)",
      },
      {
        id: "search",
        label: "Search Zone",
        fill: "rgba(22, 78, 99, 0.5)",
        stroke: "rgba(45, 212, 191, 0.35)",
      },
      {
        id: "mobile",
        label: "Mobile Zone",
        fill: "rgba(55, 48, 107, 0.5)",
        stroke: "rgba(167, 139, 250, 0.35)",
      },
      {
        id: "security",
        label: "Security Zone",
        fill: "rgba(69, 26, 50, 0.45)",
        stroke: "rgba(251, 113, 133, 0.3)",
      },
      {
        id: "cloud",
        label: "Cloud Zone",
        fill: "rgba(30, 41, 59, 0.6)",
        stroke: "rgba(148, 163, 184, 0.4)",
      },
      {
        id: "ux",
        label: "UX Zone",
        fill: "rgba(20, 83, 45, 0.45)",
        stroke: "rgba(74, 222, 128, 0.35)",
      },
    ];

    this.zones = defs.map((d, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        ...d,
        x: pad + col * (cellW + gap),
        y: pad + row * (cellH + gap),
        w: cellW,
        h: cellH,
      };
    });
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#0c1220";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    for (const z of this.zones) {
      ctx.fillStyle = z.fill;
      ctx.strokeStyle = z.stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(z.x, z.y, z.w, z.h, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(148, 163, 184, 0.55)";
      ctx.font = "600 10px Pretendard, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(z.label, z.x + 8, z.y + 8);
    }

    ctx.strokeStyle = "rgba(51, 65, 85, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    for (let x = 0; x < WORLD_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_H);
      ctx.stroke();
    }
    for (let y = 0; y < WORLD_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_W, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
}
