import { WORLD_H, WORLD_W } from "@/lib/waitGame/constants";
import type { WallRect } from "@/lib/waitGame/stageTypes";

export const MAZE_CELL = 20;
export const MAZE_COLS = Math.floor(WORLD_W / MAZE_CELL);
export const MAZE_ROWS = Math.floor(WORLD_H / MAZE_CELL);
export const WALL_THICK = 8;

export type ParsedMaze = {
  walls: WallRect[];
  playerStart: { x: number; y: number };
  exit: { x: number; y: number; r: number };
  fragmentCells: { x: number; y: number }[];
  walkableCells: { x: number; y: number }[];
};

function cellCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: col * MAZE_CELL + MAZE_CELL / 2,
    y: row * MAZE_CELL + MAZE_CELL / 2,
  };
}

/** Pad / trim every row to MAZE_COLS and row count to MAZE_ROWS. */
export function normalizeMaze(rows: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < MAZE_ROWS; i++) {
    const row = rows[i] ?? "";
    out.push(row.padEnd(MAZE_COLS, "#").slice(0, MAZE_COLS));
  }
  return out;
}

function isWall(rows: string[], col: number, row: number): boolean {
  if (row < 0 || row >= rows.length) return true;
  const line = rows[row];
  if (col < 0 || col >= line.length) return true;
  return line[col] === "#";
}

/** Build collision blocks + metadata from ASCII maze (# wall, . walk, P start, E exit, F fragment). */
export function parseMazeGrid(rows: string[]): ParsedMaze {
  const normalized = normalizeMaze(rows);
  const walls: WallRect[] = [];
  let playerStart = { x: MAZE_CELL * 2, y: MAZE_CELL * 2 };
  let exit = { x: WORLD_W - 40, y: WORLD_H - 40, r: 22 };
  const fragmentCells: { x: number; y: number }[] = [];
  const walkableCells: { x: number; y: number }[] = [];

  for (let row = 0; row < normalized.length; row++) {
    for (let col = 0; col < normalized[row].length; col++) {
      const ch = normalized[row][col];
      const cx = col * MAZE_CELL;
      const cy = row * MAZE_CELL;

      if (ch === "#") {
        walls.push({
          x: cx + (MAZE_CELL - WALL_THICK) / 2,
          y: cy + (MAZE_CELL - WALL_THICK) / 2,
          w: WALL_THICK,
          h: WALL_THICK,
        });
      } else if (ch === "P") {
        playerStart = cellCenter(col, row);
        walkableCells.push(cellCenter(col, row));
      } else if (ch === "E") {
        exit = { ...cellCenter(col, row), r: 22 };
        walkableCells.push(cellCenter(col, row));
      } else if (ch === "F") {
        const pt = cellCenter(col, row);
        fragmentCells.push(pt);
        walkableCells.push(pt);
      } else if (ch === ".") {
        walkableCells.push(cellCenter(col, row));
      }
    }
  }

  return { walls, playerStart, exit, fragmentCells, walkableCells };
}

/** Neon blueprint wall edges between # and walkable cells. */
export function drawBlueprintMaze(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  stroke: string,
  glow: string,
) {
  const normalized = normalizeMaze(rows);

  ctx.save();
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";

  const drawSeg = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.strokeStyle = glow;
    ctx.lineWidth = 5;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  for (let row = 0; row < normalized.length; row++) {
    for (let col = 0; col < MAZE_COLS; col++) {
      if (!isWall(normalized, col, row)) continue;
      const x = col * MAZE_CELL;
      const y = row * MAZE_CELL;
      const s = MAZE_CELL;

      if (!isWall(normalized, col, row - 1)) drawSeg(x, y, x + s, y);
      if (!isWall(normalized, col + 1, row)) drawSeg(x + s, y, x + s, y + s);
      if (!isWall(normalized, col, row + 1)) drawSeg(x, y + s, x + s, y + s);
      if (!isWall(normalized, col - 1, row)) drawSeg(x, y, x, y + s);
    }
  }
  ctx.restore();
}

export function drawBlueprintGrid(
  ctx: CanvasRenderingContext2D,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.12;
  for (let x = 0; x <= WORLD_W; x += MAZE_CELL) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_H);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD_H; y += MAZE_CELL) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
