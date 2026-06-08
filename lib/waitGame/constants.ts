export const WORLD_W = 720;
export const WORLD_H = 440;
export const STAGE_COUNT = 5;
export const FRAGMENTS_PER_STAGE = 10;
export const VISION_RANGE = 210;
/** Full vision cone width in degrees (~92°). */
export const VISION_FOV_DEG = 92;
export const VISION_HALF_ANGLE = (VISION_FOV_DEG * Math.PI) / 360;
/** Extra pickup distance beyond player + fragment radii. */
export const FRAGMENT_PICKUP_EXTRA = 14;
/** How close the player must be to the exit center to advance. */
export const EXIT_TOUCH_DIST = 20;
