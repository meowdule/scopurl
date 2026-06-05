import { STAGE_COUNT } from "@/lib/waitGame/constants";
import type { StageDefinition } from "@/lib/waitGame/stageTypes";

const digitalTheme = (
  accent: string,
  wall: string,
  glow: string,
): StageDefinition["theme"] => ({
  bg: "#030812",
  grid: "rgba(34, 211, 238, 0.08)",
  wallStroke: wall,
  wallGlow: glow,
  accent,
  fog: "rgba(1, 6, 14, 0.98)",
  visionRim: "rgba(52, 211, 153, 0.45)",
  visionFill: "rgba(52, 211, 153, 0.08)",
  exitGlow: "rgba(34, 211, 238, 0.4)",
  exitActive: "#34d399",
  fragmentGlow: "#38bdf8",
  fragmentCore: "#e0f2fe",
  hudBorder: "rgba(34, 211, 238, 0.45)",
});

const baseGen = {
  roomCountMin: 8,
  roomCountMax: 11,
  minRoomW: 4,
  maxRoomW: 7,
  minRoomH: 3,
  maxRoomH: 5,
  corridorWidth: 2,
};

export const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    id: 1,
    name: "잊혀진 마을",
    tagline: "연결된 디지털 방",
    theme: digitalTheme("#22d3ee", "#67e8f9", "rgba(34, 211, 238, 0.85)"),
    generator: { ...baseGen, roomCountMin: 8, roomCountMax: 10 },
  },
  {
    id: 2,
    name: "빛나는 도시",
    tagline: "네온 방 네트워크",
    theme: digitalTheme(
      "#e879f9",
      "#f0abfc",
      "rgba(232, 121, 249, 0.85)",
    ),
    generator: { ...baseGen, roomCountMin: 9, roomCountMax: 11 },
  },
  {
    id: 3,
    name: "거대한 연구소",
    tagline: "실험 구역 클러스터",
    theme: digitalTheme(
      "#4ade80",
      "#86efac",
      "rgba(74, 222, 128, 0.85)",
    ),
    generator: { ...baseGen, minRoomW: 5, maxRoomW: 8 },
  },
  {
    id: 4,
    name: "기억의 탑",
    tagline: "층별 방 연결",
    theme: digitalTheme(
      "#fbbf24",
      "#fde68a",
      "rgba(251, 191, 36, 0.85)",
    ),
    generator: { ...baseGen, roomCountMin: 7, roomCountMax: 9, maxRoomH: 6 },
  },
  {
    id: 5,
    name: "하늘의 도서관",
    tagline: "최종 기억 회로",
    theme: digitalTheme(
      "#38bdf8",
      "#bae6fd",
      "rgba(56, 189, 248, 0.9)",
    ),
    generator: { ...baseGen, roomCountMin: 10, roomCountMax: 12 },
  },
];

export function getStageDefinition(index: number): StageDefinition {
  return STAGE_DEFINITIONS[Math.max(0, Math.min(STAGE_COUNT - 1, index))];
}
