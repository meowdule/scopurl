export type WallRect = { x: number; y: number; w: number; h: number };

export type StageTheme = {
  bg: string;
  path: string;
  pathStroke: string;
  building: string;
  buildingStroke: string;
  accent: string;
  fog: string;
  visionRim: string;
  exitGlow: string;
  fragmentGlow: string;
};

export type ZoneDraw = {
  kind: "rect" | "roundRect" | "circle" | "ring";
  x: number;
  y: number;
  w?: number;
  h?: number;
  r?: number;
  fill: string;
  stroke?: string;
  label?: string;
};

export type StageDefinition = {
  id: number;
  name: string;
  tagline: string;
  theme: StageTheme;
  playerStart: { x: number; y: number };
  exit: { x: number; y: number; r: number };
  walls: WallRect[];
  zones: ZoneDraw[];
  spawnPoints: { x: number; y: number }[];
};
