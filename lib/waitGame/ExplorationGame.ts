import {
  FRAGMENTS_PER_STAGE,
  STAGE_COUNT,
  WORLD_H,
  WORLD_W,
} from "@/lib/waitGame/constants";
import { DataFragment } from "@/lib/waitGame/DataFragment";
import { InfoPanel } from "@/lib/waitGame/InfoPanel";
import { PLAYER_RADIUS, Player } from "@/lib/waitGame/Player";
import { getStageDefinition } from "@/lib/waitGame/stageDefinitions";
import { StageMap } from "@/lib/waitGame/StageMap";
import type { WebTip } from "@/lib/waitGame/tips";
import { VisionCone } from "@/lib/waitGame/VisionCone";

export { FRAGMENTS_PER_STAGE };
export const TOTAL_FRAGMENTS = FRAGMENTS_PER_STAGE;

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
  map!: StageMap;
  readonly player = new Player(360, 220);
  fragments: DataFragment[] = [];
  readonly infoPanel = new InfoPanel();
  readonly pickupToasts: PickupToast[] = [];

  stageIndex = 0;
  exitActive = false;
  missionComplete = false;
  stageClearFlash = 0;

  private readonly bursts: { x: number; y: number; age: number }[] = [];
  private time = 0;
  private toastId = 0;

  constructor() {
    this.loadStage(0);
  }

  get stageName(): string {
    return this.map.def.name;
  }

  get stageTagline(): string {
    return this.map.def.tagline;
  }

  get collectedCount(): number {
    return this.fragments.filter((f) => f.collected).length;
  }

  get fragmentsPerStage(): number {
    return FRAGMENTS_PER_STAGE;
  }

  get isStageComplete(): boolean {
    return this.collectedCount >= FRAGMENTS_PER_STAGE;
  }

  get activeToasts(): readonly PickupToast[] {
    return this.pickupToasts;
  }

  loadStage(index: number) {
    this.stageIndex = index;
    const def = getStageDefinition(index);
    this.map = new StageMap(def);
    const faceUp = def.playerStart.y > def.exit.y ? -Math.PI / 2 : Math.PI / 2;
    this.player.resetTo(def.playerStart.x, def.playerStart.y, faceUp);

    const pts = [...def.spawnPoints].sort(() => Math.random() - 0.5);
    this.fragments = pts
      .slice(0, FRAGMENTS_PER_STAGE)
      .map((p, i) => new DataFragment(i, p.x, p.y));

    this.exitActive = false;
    this.pickupToasts.length = 0;
  }

  reset() {
    this.missionComplete = false;
    this.stageClearFlash = 0;
    this.infoPanel.reset();
    this.time = 0;
    this.loadStage(0);
  }

  private vision(): VisionCone {
    return new VisionCone(this.player.x, this.player.y, this.player.facing);
  }

  update(dt: number, keys: ReadonlySet<string>) {
    if (this.missionComplete) return;

    this.time += dt;
    if (this.stageClearFlash > 0) {
      this.stageClearFlash -= dt;
      return;
    }

    this.player.update(dt, keys);
    const resolved = this.map.resolveCircle(
      this.player.x,
      this.player.y,
      PLAYER_RADIUS,
    );
    this.player.x = resolved.x;
    this.player.y = resolved.y;

    const vision = this.vision();
    const { x: px, y: py } = this.player;

    if (this.isStageComplete) {
      this.exitActive = true;
    }

    if (this.exitActive) {
      const ex = this.map.exit;
      const dist = Math.hypot(px - ex.x, py - ex.y);
      if (dist < ex.r + PLAYER_RADIUS + 4) {
        this.advanceStage();
        return;
      }
    }

    for (const fragment of this.fragments) {
      fragment.updateAnim(dt);
      if (fragment.tryCollect(px, py, PLAYER_RADIUS, vision)) {
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

  private advanceStage() {
    if (this.stageIndex >= STAGE_COUNT - 1) {
      this.missionComplete = true;
      return;
    }
    this.stageClearFlash = 1.2;
    this.loadStage(this.stageIndex + 1);
  }

  private pushPickupToast(emoji: string, tip: WebTip) {
    this.pickupToasts.unshift({
      id: this.toastId++,
      emoji,
      title: "기억 조각 획득",
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
    const vision = this.vision();
    const theme = this.map.theme;

    ctx.fillStyle = "#0a0e14";
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.save();
    ctx.translate(camX, camY);
    ctx.globalAlpha = 0.48;
    this.map.render(ctx, "dim");
    ctx.globalAlpha = 1;
    vision.fillFogOutside(ctx, WORLD_W, WORLD_H, theme.fog);
    ctx.restore();

    ctx.save();
    ctx.translate(camX, camY);
    vision.clip(ctx);
    this.map.render(ctx, "bright");
    this.map.renderExit(ctx, this.exitActive, pulse);

    for (const f of this.fragments) {
      f.render(ctx, this.time, vision);
    }

    this.renderBursts(ctx);
    vision.fillDistanceFade(ctx);
    ctx.restore();

    this.player.renderScreen(ctx, cx, cy, pulse);
    vision.strokeRim(ctx, theme.visionRim);

    this.map.renderMinimap(
      ctx,
      MINIMAP.x,
      MINIMAP.y,
      MINIMAP.w,
      MINIMAP.h,
      this.player.x,
      this.player.y,
      this.stageIndex,
    );

    if (this.stageClearFlash > 0) {
      const a = Math.min(1, this.stageClearFlash);
      ctx.fillStyle = `rgba(0, 196, 113, ${0.25 * a})`;
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.fillStyle = `rgba(255,255,255,${0.9 * a})`;
      ctx.font = "700 14px Pretendard, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `Stage ${this.stageIndex + 1} — ${this.stageName}`,
        canvasW / 2,
        canvasH / 2,
      );
    }

    if (this.missionComplete) {
      ctx.fillStyle = "rgba(7, 43, 34, 0.88)";
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.fillStyle = "#a7f3d0";
      ctx.font = "700 18px Pretendard, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Mission Complete", canvasW / 2, canvasH / 2 - 8);
      ctx.font = "500 12px Pretendard, system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("모든 기억의 장소를 탐험했습니다", canvasW / 2, canvasH / 2 + 14);
    }
  }

  private renderBursts(ctx: CanvasRenderingContext2D) {
    for (const b of this.bursts) {
      const t = b.age / 0.5;
      const r = 8 + t * 36;
      ctx.strokeStyle = `rgba(251, 191, 36, ${(1 - t) * 0.9})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = "bold 13px system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(254, 243, 199, ${1 - t})`;
      ctx.fillText("+1", b.x, b.y - t * 20);
    }
  }
}
