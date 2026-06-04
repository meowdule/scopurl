/** Player-centered vision cone (world space). */
export function isInVisionCone(
  wx: number,
  wy: number,
  px: number,
  py: number,
  facing: number,
  range: number,
  halfAngle: number,
): boolean {
  const dx = wx - px;
  const dy = wy - py;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;

  const angleTo = Math.atan2(dy, dx);
  let diff = angleTo - facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= halfAngle;
}

/** Screen-space cone clip (player at canvas center). */
export function clipVisionCone(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  facing: number,
  range: number,
  halfAngle: number,
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.clip();
}
