import {
  MAZE_COLS,
  MAZE_ROWS,
  findReachableCells,
  normalizeMaze,
} from "@/lib/waitGame/mazeGrid";
import type { StageGeneratorConfig } from "@/lib/waitGame/stageTypes";

type Room = {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
};

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createGrid(): string[][] {
  return Array.from({ length: MAZE_ROWS }, () =>
    Array.from({ length: MAZE_COLS }, () => "#"),
  );
}

function roomsOverlap(a: Room, b: Room, gap: number): boolean {
  return (
    a.x - gap < b.x + b.w &&
    a.x + a.w + gap > b.x &&
    a.y - gap < b.y + b.h &&
    a.y + a.h + gap > b.y
  );
}

function carveRoom(grid: string[][], room: Room) {
  for (let row = room.y; row < room.y + room.h; row++) {
    for (let col = room.x; col < room.x + room.w; col++) {
      if (row > 0 && row < MAZE_ROWS - 1 && col > 0 && col < MAZE_COLS - 1) {
        grid[row][col] = ".";
      }
    }
  }
}

function stamp(grid: string[][], col: number, row: number, ch: string) {
  if (row > 0 && row < MAZE_ROWS - 1 && col > 0 && col < MAZE_COLS - 1) {
    const cur = grid[row][col];
    if (cur === "." || cur === "#") grid[row][col] = ch;
    else if (ch === "P" || ch === "E") grid[row][col] = ch;
  }
}

function carveThickPoint(
  grid: string[][],
  col: number,
  row: number,
  half: number,
) {
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const c = col + dx;
      const r = row + dy;
      if (r > 0 && r < MAZE_ROWS - 1 && c > 0 && c < MAZE_COLS - 1) {
        const ch = grid[r][c];
        if (ch !== "P" && ch !== "E") grid[r][c] = ".";
      }
    }
  }
}

function carveCorridor(
  grid: string[][],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  half: number,
  rng: () => number,
) {
  let x = x0;
  let y = y0;
  const horizontalFirst = rng() > 0.5;

  const stepH = () => {
    const dir = x1 > x ? 1 : -1;
    while (x !== x1) {
      carveThickPoint(grid, x, y, half);
      x += dir;
    }
  };
  const stepV = () => {
    const dir = y1 > y ? 1 : -1;
    while (y !== y1) {
      carveThickPoint(grid, x, y, half);
      y += dir;
    }
  };

  if (horizontalFirst) {
    stepH();
    stepV();
  } else {
    stepV();
    stepH();
  }
  carveThickPoint(grid, x1, y1, half);
}

function connectRooms(grid: string[][], rooms: Room[], rng: () => number) {
  if (rooms.length < 2) return;
  const connected = new Set<number>([0]);
  const pending = new Set(rooms.map((_, i) => i).filter((i) => i !== 0));

  while (pending.size > 0) {
    let bestFrom = 0;
    let bestTo = -1;
    let bestDist = Infinity;

    for (const ci of Array.from(connected)) {
      for (const pi of Array.from(pending)) {
        const d =
          Math.abs(rooms[ci].cx - rooms[pi].cx) +
          Math.abs(rooms[ci].cy - rooms[pi].cy);
        if (d < bestDist) {
          bestDist = d;
          bestFrom = ci;
          bestTo = pi;
        }
      }
    }

    if (bestTo < 0) break;
    const a = rooms[bestFrom];
    const b = rooms[bestTo];
    carveCorridor(grid, a.cx, a.cy, b.cx, b.cy, 1, rng);
    connected.add(bestTo);
    pending.delete(bestTo);
  }
}

function gridToMaze(grid: string[][]): string[] {
  return normalizeMaze(grid.map((r) => r.join("")));
}

function tryGenerate(
  seed: number,
  stageIndex: number,
  config: StageGeneratorConfig,
): string[] | null {
  const rng = mulberry32(seed + stageIndex * 9973);
  const grid = createGrid();
  const rooms: Room[] = [];
  const roomTarget =
    config.roomCountMin +
    Math.floor(rng() * (config.roomCountMax - config.roomCountMin + 1));
  const half = Math.max(0, Math.floor(config.corridorWidth / 2) - 1);

  for (let attempt = 0; attempt < 120 && rooms.length < roomTarget; attempt++) {
    const w =
      config.minRoomW +
      Math.floor(rng() * (config.maxRoomW - config.minRoomW + 1));
    const h =
      config.minRoomH +
      Math.floor(rng() * (config.maxRoomH - config.minRoomH + 1));
    const x = 1 + Math.floor(rng() * (MAZE_COLS - w - 2));
    const y = 1 + Math.floor(rng() * (MAZE_ROWS - h - 2));
    const room: Room = {
      x,
      y,
      w,
      h,
      cx: Math.floor(x + w / 2),
      cy: Math.floor(y + h / 2),
    };
    if (rooms.some((r) => roomsOverlap(r, room, 2))) continue;
    rooms.push(room);
    carveRoom(grid, room);
  }

  if (rooms.length < 5) return null;

  connectRooms(grid, rooms, rng);

  const startIdx = Math.floor(rng() * rooms.length);
  const start = rooms[startIdx];
  stamp(grid, start.cx, start.cy, "P");

  let exitIdx = startIdx;
  let maxDist = -1;
  const reachable = findReachableCells(
    grid.map((r) => r.join("")),
    start.cx,
    start.cy,
  );

  for (let i = 0; i < rooms.length; i++) {
    if (i === startIdx) continue;
    const r = rooms[i];
    if (!reachable.has(`${r.cx},${r.cy}`)) continue;
    const d = Math.abs(r.cx - start.cx) + Math.abs(r.cy - start.cy);
    if (d > maxDist) {
      maxDist = d;
      exitIdx = i;
    }
  }

  if (maxDist < 0) return null;

  const exit = rooms[exitIdx];
  stamp(grid, exit.cx, exit.cy, "E");

  const maze = gridToMaze(grid);
  const parsedReachable = findReachableCells(maze, start.cx, start.cy);
  if (!parsedReachable.has(`${exit.cx},${exit.cy}`)) return null;

  return maze;
}

/** Procedural multi-room dungeon; retries with seed offset on failure. */
export function generateRoomMaze(
  seed: number,
  stageIndex: number,
  config: StageGeneratorConfig,
): string[] {
  for (let i = 0; i < 12; i++) {
    const maze = tryGenerate(seed + i * 131, stageIndex, config);
    if (maze) return maze;
  }
  return fallbackMaze();
}

function fallbackMaze(): string[] {
  return normalizeMaze([
    "####################################",
    "#P.................................#",
    "#..########............#########..#",
    "#..#......#............#.......#..#",
    "#..#......#............#.......#..#",
    "#..#......#............#.......#..#",
    "#..########............#########..#",
    "#............########............#",
    "#............#......#............#",
    "#............#......#............#",
    "#..#########.#......#.#########..#",
    "#..#........#......#........#..#",
    "#..#........#......#........#..#",
    "#..#########.#......#.#########..#",
    "#............#......#............#",
    "#............#......#............#",
    "#..#########............#########..#",
    "#..#............................#..#",
    "#..#............................#..#",
    "#..#............................#..#",
    "#...............................E..#",
    "####################################",
  ]);
}
