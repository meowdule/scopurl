export type WallRect = { x: number; y: number; w: number; h: number };

export type StageTheme = {
  bg: string;
  grid: string;
  wallStroke: string;
  wallGlow: string;
  accent: string;
  fog: string;
  visionRim: string;
  visionFill: string;
  exitGlow: string;
  exitActive: string;
  fragmentGlow: string;
  fragmentCore: string;
  hudBorder: string;
};

export type StageDefinition = {
  id: number;
  name: string;
  tagline: string;
  theme: StageTheme;
  /** ASCII maze rows (# wall, . floor, P player, E exit, F fragment spawn). */
  maze: string[];
  /** Extra fragment positions if fewer than 10 F cells in maze. */
  extraSpawns?: { x: number; y: number }[];
};
