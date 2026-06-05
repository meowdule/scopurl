import { DataFragment } from "@/lib/waitGame/DataFragment";
import { InfoPanel } from "@/lib/waitGame/InfoPanel";
import { Map, WORLD_H, WORLD_W } from "@/lib/waitGame/Map";
import { PLAYER_RADIUS, Player } from "@/lib/waitGame/Player";
import type { WebTip } from "@/lib/waitGame/tips";
import { clipVisionCone, isInVisionCone } from "@/lib/waitGame/vision";

export const TOTAL_FRAGMENTS = 20;
export const VISION_RANGE = 190;
export const VISION_HALF_ANGLE = Math.PI / 3.8;

export type PickupToast = {
  id: number;
  emoji: string;
  title: string;
  subtitle: string;
  age: number;
};

const TOAST_LIFE = 2.8;
const MINIMAP = { x: 10, y: 10, w: 118, h: 72 };

export class ExplorationGame {
  readonly map: Map;
  readonly player: Player;
  readonly fragments: DataFragment[];
  readonly infoPanel: InfoPanel;
  readonly pickupToasts: PickupToast[] = [];
  private readonly bursts: { x: number; y: number; age: number }[] = [];
  private time = 0;
  private toastId = 0;

  constructor() {
    this.map = new Map();
    this.player = new Player(WORLD_W / 2, 218);
    this.fragments = buildFragments(this.map);
    this.infoPanel = new InfoPanel();
  }

  get collectedCount(): number {
    return this.fragments.filter((f) => f.collected).length;
  }

  get isComplete(): boolean {
    return this.collectedCount >= TOTAL_FRAGMENTS;
  }

  get activeToasts(): readonly PickupToast[] {
    return this.pickupToasts;
  }

  reset() {
    this.player.x = WORLD_W / 2;
    this.player.y = 218;
    this.player.vx = 0;
    this.player.vy = 0;
    this.fragments.forEach((f) => {
      f.collected = false;
      f.popT = -1;
      f.discovered = false;
    });
    this.infoPanel.reset();
    this.pickupToasts.length = 0;
    this.time = 0;
  }

  update(dt: number, keys: ReadonlySet<string>) {
    this.time += dt;
    this.player.update(dt, keys, { w: WORLD_W, h: WORLD_H });

    const resolved = this.map.resolveCircle(
      this.player.x,
      this.player.y,
      PLAYER_RADIUS,
    );
    this.player.x = resolved.x;
    this.player.y = resolved.y;

    const { x: px, y: py, facing } = this.player;

    for (const fragment of this.fragments) {
      fragment.updateAnim(dt);

      if (
        !fragment.collected &&
        isInVisionCone(
          fragment.x,
          fragment.y,
          px,
          py,
          facing,
          VISION_RANGE,
          VISION_HALF_ANGLE,
        )
      ) {
        fragment.discovered = true;
      }

      if (
        fragment.tryCollect(
          px,
          py,
          PLAYER_RADIUS,
          facing,
          VISION_RANGE,
          VISION_HALF_ANGLE,
        )
      ) {
        const tip = this.infoPanel.addFromFragment();
        this.pushPickupToast(fragment.emoji, tip);
        this.bursts.push({ x: fragment.x, y: fragment.y, age: 0 });
      }
    }

    for (let i = this.bursts.length - 1; i >= 0; i--) {
      this.bursts[i].age += dt;
      if (this.bursts[i].age > 0.5) this.bursts.splice(i, 1);
    }

    for (let i = this.pickupToasts.length - 1; i >= 0; i--) {
      this.pickupToasts[i].age += dt;
      if (this.pickupToasts[i].age > TOAST_LIFE) {
        this.pickupToasts.splice(i, 1);
      }
    }
  }

  private pushPickupToast(emoji: string, tip: WebTip) {
    this.pickupToasts.unshift({
      id: this.toastId++,
      emoji,
      title: "데이터 조각 획득",
      subtitle: tip.tag,
      age: 0,
    });
    if (this.pickupToasts.length > 4) {
      this.pickupToasts.length = 4;
    }
  }

  render(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number) {
    const pulse = 0.5 + Math.sin(this.time * 4) * 0.5;
    const camX = canvasW / 2 - this.player.x;
    const camY = canvasH / 2 - this.player.y;
    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const facing = this.player.facing;

    ctx.fillStyle = "#0f1419";
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.save();
    ctx.translate(camX, camY);
    ctx.globalAlpha = 0.52;
    this.map.render(ctx, "dim");
    ctx.globalAlpha = 1;
    ctx.restore();

    this.renderFogOutside(ctx, canvasW, canvasH, cx, cy, facing);

    ctx.save();
    clipVisionCone(ctx, cx, cy, facing, VISION_RANGE, VISION_HALF_ANGLE);
    ctx.translate(camX, camY);
    this.map.render(ctx, "bright");

    for (const f of this.fragments) {
      if (
        f.isVisible(
          this.player.x,
          this.player.y,
          facing,
          VISION_RANGE,
          VISION_HALF_ANGLE,
        )
      ) {
        f.render(ctx, this.time);
      }
    }

    this.renderBursts(ctx);
    ctx.restore();

    this.player.renderScreen(ctx, cx, cy, pulse);
    this.renderVisionRim(ctx, cx, cy, facing);

    this.map.renderMinimap(
      ctx,
      MINIMAP.x,
      MINIMAP.y,
      MINIMAP.w,
      MINIMAP.h,
      this.player.x,
      this.player.y,
      facing,
    );
  }

  private renderBursts(ctx: CanvasRenderingContext2D) {
    for (const b of this.bursts) {
      const t = b.age / 0.5;
      const r = 8 + t * 36;
      ctx.strokeStyle = `rgba(0, 196, 113, ${(1 - t) * 0.85})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(167, 243, 208, ${(1 - t) * 0.35})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "bold 13px system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(240, 253, 244, ${1 - t})`;
      ctx.fillText("+1", b.x, b.y - t * 20);
    }
  }

  /** Dark overlay only outside the vision cone (evenodd — no inner wash). */
  private renderFogOutside(
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number,
    cx: number,
    cy: number,
    facing: number,
  ) {
    ctx.save();
    ctx.fillStyle = "rgba(2, 5, 12, 0.82)";
    ctx.beginPath();
    ctx.rect(0, 0, canvasW, canvasH);
    ctx.moveTo(cx, cy);
    ctx.arc(
      cx,
      cy,
      VISION_RANGE,
      facing - VISION_HALF_ANGLE,
      facing + VISION_HALF_ANGLE,
    );
    ctx.closePath();
    ctx.fill("evenodd");
    ctx.restore();
  }

  private renderVisionRim(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    facing: number,
  ) {
    ctx.save();
    ctx.strokeStyle = "rgba(0, 196, 113, 0.75)";
    ctx.lineWidth = 2.5;
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
    ctx.stroke();

    ctx.strokeStyle = "rgba(167, 243, 208, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(facing) * VISION_RANGE * 0.92,
      cy + Math.sin(facing) * VISION_RANGE * 0.92,
    );
    ctx.stroke();
    ctx.restore();
  }
}

function buildFragments(map: Map): DataFragment[] {
  const points = map.getSpawnPoints();
  const shuffled = [...points].sort(() => Math.random() - 0.5);
  const out: DataFragment[] = [];

  for (let i = 0; i < TOTAL_FRAGMENTS && i < shuffled.length; i++) {
    out.push(new DataFragment(i, shuffled[i].x, shuffled[i].y));
  }

  let id = out.length;
  while (out.length < TOTAL_FRAGMENTS) {
    out.push(
      new DataFragment(
        id++,
        80 + Math.random() * (WORLD_W - 160),
        80 + Math.random() * (WORLD_H - 160),
      ),
    );
  }

  return out;
}
