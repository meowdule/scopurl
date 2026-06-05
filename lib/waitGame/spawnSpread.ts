export const MIN_FRAGMENT_SPREAD = 72;

/** Pick up to `count` points with at least `minDist` px between each pair. */
export function pickSpreadPoints(
  candidates: { x: number; y: number }[],
  count: number,
  minDist = MIN_FRAGMENT_SPREAD,
): { x: number; y: number }[] {
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const picked: { x: number; y: number }[] = [];

  const farEnough = (p: { x: number; y: number }) =>
    picked.every(
      (q) => Math.hypot(p.x - q.x, p.y - q.y) >= minDist,
    );

  for (const p of shuffled) {
    if (!farEnough(p)) continue;
    picked.push(p);
    if (picked.length >= count) return picked;
  }

  const relaxed = Math.max(48, minDist * 0.72);
  for (const p of shuffled) {
    if (picked.some((q) => q.x === p.x && q.y === p.y)) continue;
    const ok = picked.every(
      (q) => Math.hypot(p.x - q.x, p.y - q.y) >= relaxed,
    );
    if (!ok) continue;
    picked.push(p);
    if (picked.length >= count) return picked;
  }

  for (const p of shuffled) {
    if (picked.length >= count) break;
    if (picked.some((q) => q.x === p.x && q.y === p.y)) continue;
    picked.push(p);
  }

  return picked.slice(0, count);
}
