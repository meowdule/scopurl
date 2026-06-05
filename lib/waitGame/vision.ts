/** @deprecated Use VisionCone — kept for backward-compatible imports. */
export { VisionCone } from "@/lib/waitGame/VisionCone";
export {
  VISION_RANGE,
  VISION_HALF_ANGLE,
} from "@/lib/waitGame/constants";

import { VisionCone } from "@/lib/waitGame/VisionCone";
import { VISION_HALF_ANGLE, VISION_RANGE } from "@/lib/waitGame/constants";

export function isInVisionCone(
  wx: number,
  wy: number,
  px: number,
  py: number,
  facing: number,
  range = VISION_RANGE,
  halfAngle = VISION_HALF_ANGLE,
): boolean {
  return new VisionCone(px, py, facing).contains(wx, wy);
}

export function visionFalloff(
  wx: number,
  wy: number,
  px: number,
  py: number,
  facing: number,
  range = VISION_RANGE,
  halfAngle = VISION_HALF_ANGLE,
): number {
  return new VisionCone(px, py, facing).falloff(wx, wy);
}

export function clipVisionCone(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  facing: number,
  range = VISION_RANGE,
  halfAngle = VISION_HALF_ANGLE,
) {
  new VisionCone(cx, cy, facing).clip(ctx);
}
