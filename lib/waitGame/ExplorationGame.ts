import { DataFragment } from "@/lib/waitGame/DataFragment";
import { InfoPanel } from "@/lib/waitGame/InfoPanel";
import { Map, WORLD_H, WORLD_W } from "@/lib/waitGame/Map";
import { PLAYER_RADIUS, Player } from "@/lib/waitGame/Player";

export const TOTAL_FRAGMENTS = 20;

const VISION_RANGE = 165;
const VISION_HALF_ANGLE = Math.PI / 5;

export class ExplorationGame {
  readonly map: Map;
  readonly player: Player;
  readonly fragments: DataFragment[];
  readonly infoPanel: InfoPanel;
  private time = 0;

  constructor() {
    this.map = new Map();
    this.player = new Player(WORLD_W / 2, WORLD_H / 2);
    this.fragments = buildFragments(this.map);
    this.infoPanel = new InfoPanel();
  }

  get collectedCount(): number {
    return this.fragments.filter((f) => f.collected).length;
  }

  get isComplete(): boolean {
    return this.collectedCount >= TOTAL_FRAGMENTS;
  }

  reset() {
    this.player.x = WORLD_W / 2;
    this.player.y = WORLD_H / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.fragments.forEach((f) => {
      f.collected = false;
    });
    this.infoPanel.reset();
    this.time = 0;
  }

  update(dt: number, keys: ReadonlySet<string>) {
    this.time += dt;
    this.player.update(dt, keys, { w: WORLD_W, h: WORLD_H });

    for (const fragment of this.fragments) {
      if (fragment.tryCollect(this.player.x, this.player.y, PLAYER_RADIUS)) {
        this.infoPanel.addFromFragment();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number) {
    const pulse = 0.5 + Math.sin(this.time * 4) * 0.5;
    const camX = canvasW / 2 - this.player.x;
    const camY = canvasH / 2 - this.player.y;

    ctx.save();
    ctx.translate(camX, camY);
    this.map.render(ctx);
    for (const f of this.fragments) {
      f.render(ctx, this.time);
    }
    this.player.render(ctx, pulse);
    ctx.restore();

    this.renderVisionFog(ctx, canvasW, canvasH);
  }

  /** Monaco-style vision cone from screen center (player is camera-centered). */
  private renderVisionFog(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
  ) {
    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const facing = this.player.facing;

    ctx.save();
    ctx.fillStyle = "rgba(8, 12, 22, 0.72)";
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.globalCompositeOperation = "destination-out";

    const cone = ctx.createRadialGradient(cx, cy, 0, cx, cy, VISION_RANGE);
    cone.addColorStop(0, "rgba(0,0,0,1)");
    cone.addColorStop(0.55, "rgba(0,0,0,0.85)");
    cone.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(
      cx,
      cy,
      VISION_RANGE,
      facing - VISION_HALF_ANGLE,
      facing + VISION_HALF_ANGLE,
    );
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";

    const rim = ctx.createRadialGradient(cx, cy, VISION_RANGE * 0.7, cx, cy, VISION_RANGE);
    rim.addColorStop(0, "rgba(0, 196, 113, 0)");
    rim.addColorStop(1, "rgba(0, 196, 113, 0.12)");
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(
      cx,
      cy,
      VISION_RANGE,
      facing - VISION_HALF_ANGLE,
      facing + VISION_HALF_ANGLE,
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

function buildFragments(map: Map): DataFragment[] {
  const out: DataFragment[] = [];
  let id = 0;
  const perZone = Math.ceil(TOTAL_FRAGMENTS / map.zones.length);

  for (const zone of map.zones) {
    const margin = 28;
    for (let i = 0; i < perZone && out.length < TOTAL_FRAGMENTS; i++) {
      const x = zone.x + margin + Math.random() * (zone.w - margin * 2);
      const y = zone.y + margin + Math.random() * (zone.h - margin * 2);
      out.push(new DataFragment(id++, x, y));
    }
  }

  while (out.length < TOTAL_FRAGMENTS) {
    out.push(
      new DataFragment(
        id++,
        40 + Math.random() * (WORLD_W - 80),
        40 + Math.random() * (WORLD_H - 80),
      ),
    );
  }

  return out;
}
