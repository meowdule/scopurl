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

export type StageGeneratorConfig = {
  roomCountMin: number;
  roomCountMax: number;
  minRoomW: number;
  maxRoomW: number;
  minRoomH: number;
  maxRoomH: number;
  corridorWidth: number;
};

export type StageDefinition = {
  id: number;
  name: string;
  tagline: string;
  theme: StageTheme;
  generator: StageGeneratorConfig;
};
