import { FRAGMENTS_PER_STAGE, STAGE_COUNT } from "@/lib/waitGame/constants";
import type { StageTheme } from "@/lib/waitGame/stageTypes";

export type HudState = {
  stageIndex: number;
  stageName: string;
  collected: number;
  exitActive: boolean;
  missionComplete: boolean;
};

function hudBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  border: string,
) {
  ctx.fillStyle = "rgba(3, 10, 22, 0.82)";
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
}

export function renderGameHud(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  theme: StageTheme,
  state: HudState,
) {
  const border = theme.hudBorder;

  // Top-left status
  const lx = 10;
  const ly = 10;
  const lw = Math.min(248, canvasW * 0.42);
  const lh = 72;
  hudBox(ctx, lx, ly, lw, lh, border);

  ctx.fillStyle = "#67e8f9";
  ctx.font = "700 11px Pretendard, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(
    `스테이지 ${state.stageIndex + 1}: ${state.stageName}`,
    lx + 10,
    ly + 8,
  );

  ctx.fillStyle = "#38bdf8";
  ctx.font = "700 13px Pretendard, system-ui, sans-serif";
  ctx.fillText(
    `◆ ${state.collected} / ${FRAGMENTS_PER_STAGE}`,
    lx + 10,
    ly + 28,
  );

  ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
  ctx.font = "500 9px Pretendard, system-ui, sans-serif";
  const goal =
    state.exitActive && !state.missionComplete
      ? "출구가 열렸습니다 — EXIT 로 이동하세요"
      : "목표: 기억 조각 10개를 모두 모으고 출구로 이동";
  ctx.fillText(goal, lx + 10, ly + 50, lw - 20);

  // Top-right stage progress
  const pw = STAGE_COUNT * 34 + 16;
  const px = canvasW - pw - 10;
  const py = 10;
  hudBox(ctx, px, py, pw, 36, border);

  ctx.font = "600 8px Pretendard, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
  ctx.fillText("스테이지 진행", px + 8, py + 5);

  for (let i = 0; i < STAGE_COUNT; i++) {
    const bx = px + 8 + i * 34;
    const by = py + 16;
    const done = i < state.stageIndex;
    const current = i === state.stageIndex;
    const locked = i > state.stageIndex;

    ctx.fillStyle = done
      ? "rgba(52, 211, 153, 0.25)"
      : current
        ? "rgba(34, 211, 238, 0.2)"
        : "rgba(30, 41, 59, 0.6)";
    ctx.strokeStyle = done
      ? "#34d399"
      : current
        ? "#22d3ee"
        : "rgba(71, 85, 105, 0.6)";
    ctx.lineWidth = current ? 1.5 : 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, 26, 16, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = done || current ? "#e2e8f0" : "#64748b";
    ctx.font = "700 10px Pretendard, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(locked ? "🔒" : String(i + 1), bx + 13, by + 8);

    if (i < STAGE_COUNT - 1) {
      ctx.strokeStyle = "rgba(71, 85, 105, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 28, by + 8);
      ctx.lineTo(bx + 32, by + 8);
      ctx.stroke();
    }
  }

  // Bottom-left controls
  const cx = 10;
  const cy = canvasH - 46;
  hudBox(ctx, cx, cy, 148, 36, border);

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "600 9px Pretendard, system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("이동", cx + 8, cy + 11);

  const keys = ["W", "A", "S", "D"];
  keys.forEach((k, i) => {
    const kx = cx + 8 + i * 22;
    const ky = cy + 20;
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(kx, ky - 8, 18, 16, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "700 9px Pretendard, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(k, kx + 9, ky);
  });

  ctx.textAlign = "left";
  ctx.fillStyle = "#64748b";
  ctx.font = "500 8px Pretendard, system-ui, sans-serif";
  ctx.fillText("방향키", cx + 98, cy + 20);
}
