/** Central tuning for CI/runtime — override via env where noted. */
const fast = process.env.SITE_SCOPE_FAST === "1";

/** 무료 분석 상한 (확장 100p는 영업 수동 실행) */
export const FREE_TIER_MAX_PAGES = 20;
export const EXTENDED_TIER_MAX_PAGES = 100;
export const DEFAULT_MAX_DEPTH = 2;
export const DATA_RETENTION_DAYS = 30;

/** @type {'mobile' | 'desktop'} */
let runtimeDeviceProfile =
  process.env.SITE_SCOPE_DEVICE === "mobile" ? "mobile" : "desktop";

/** @type {number | null} */
let runtimeMaxPages = null;
/** @type {number | null} */
let runtimeMaxDepth = null;
/** @type {'failure' | 'all' | 'off'} */
let runtimeTraceMode = "failure";

export function setRuntimeTraceMode(mode) {
  if (mode === "all" || mode === "off" || mode === "failure") {
    runtimeTraceMode = mode;
  }
}

export function getRuntimeTraceMode() {
  return runtimeTraceMode;
}

export function setRuntimeDeviceProfile(profile) {
  if (profile === "mobile" || profile === "desktop") {
    runtimeDeviceProfile = profile;
  }
}

export function getRuntimeDeviceProfile() {
  return runtimeDeviceProfile;
}

/**
 * @param {{ maxPages?: number, maxDepth?: number }} limits
 */
export function setRuntimeCrawlLimits({ maxPages, maxDepth } = {}) {
  if (maxPages != null && !Number.isNaN(Number(maxPages))) {
    runtimeMaxPages = Number(maxPages);
  }
  if (maxDepth != null && !Number.isNaN(Number(maxDepth))) {
    runtimeMaxDepth = Number(maxDepth);
  }
}

function clampInt(value, min, max, fallback) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function resolveMaxPages() {
  const fromEnv = process.env.SITE_SCOPE_MAX_PAGES;
  const raw =
    runtimeMaxPages ??
    (fromEnv && !Number.isNaN(Number(fromEnv)) ? Number(fromEnv) : null);
  const base =
    raw != null ? raw : fast ? Math.min(12, FREE_TIER_MAX_PAGES) : FREE_TIER_MAX_PAGES;
  return clampInt(base, 1, FREE_TIER_MAX_PAGES, FREE_TIER_MAX_PAGES);
}

function resolveMaxDepth() {
  const fromEnv = process.env.SITE_SCOPE_MAX_DEPTH;
  const raw =
    runtimeMaxDepth ??
    (fromEnv && !Number.isNaN(Number(fromEnv)) ? Number(fromEnv) : null);
  return clampInt(raw, 0, 10, DEFAULT_MAX_DEPTH);
}

export function retentionExpiresAt(fromIso = new Date().toISOString()) {
  const d = new Date(fromIso);
  d.setUTCDate(d.getUTCDate() + DATA_RETENTION_DAYS);
  return d.toISOString();
}

export const ANALYSIS_CONFIG = {
  fast,
  get deviceProfile() {
    return runtimeDeviceProfile;
  },

  spa: {
    networkSettleMs: fast ? 1800 : 3500,
    networkSettleShortMs: fast ? 800 : 2000,
    domStableMaxMs: fast ? 700 : 2200,
    domStableShortMs: fast ? 400 : 900,
    domIdleTicks: fast ? 2 : 4,
    postScrollPauseMs: fast ? 120 : 350,
    lightScroll: !fast,
  },

  interaction: {
    profiles: {
      homepage: {
        maxInteractions: fast ? 12 : 15,
        maxRuntimeMs: fast ? 45_000 : 60_000,
        maxCandidates: fast ? 50 : 60,
        consecutiveNoChangeStop: 5,
        scrollPasses: fast ? 3 : 4,
        richHeuristics: true,
      },
      subpage: {
        maxInteractions: fast ? 5 : 6,
        maxRuntimeMs: fast ? 20_000 : 28_000,
        maxCandidates: fast ? 22 : 28,
        consecutiveNoChangeStop: 2,
        scrollPasses: 1,
        richHeuristics: false,
      },
      crawlSeed: {
        maxInteractions: fast ? 14 : 18,
        maxRuntimeMs: fast ? 50_000 : 65_000,
        maxCandidates: fast ? 55 : 65,
        consecutiveNoChangeStop: 4,
        scrollPasses: fast ? 3 : 4,
        richHeuristics: true,
      },
    },
    maxInteractionsQuick: fast ? 10 : 12,
    debug: process.env.SITE_SCOPE_DEBUG === "1",
  },

  crawl: {
    get maxPages() {
      return resolveMaxPages();
    },
    get maxDepth() {
      return resolveMaxDepth();
    },
    freeTierMaxPages: FREE_TIER_MAX_PAGES,
    homepageHybridInteraction: true,
  },

  lighthouse: {
    fullOnFirstPageOnly: true,
    fullTimeoutMs: fast ? 50_000 : 70_000,
    lightweightTimeoutMs: fast ? 28_000 : 40_000,
    fullCategories: "performance,accessibility,best-practices,seo",
    lightCategories: "performance",
    maxWaitForLoad: fast ? 18_000 : 28_000,
    skipOnSubpages: true,
  },

  screenshots: {
    get viewports() {
      if (runtimeDeviceProfile === "mobile") {
        return [{ name: "mobile", width: 390, height: 844 }];
      }
      return fast
        ? [{ name: "desktop", width: 1440, height: 900 }]
        : [
            { name: "desktop", width: 1440, height: 900 },
            { name: "mobile", width: 390, height: 844 },
          ];
    },
    type: "jpeg",
    quality: 72,
  },

  parallel: {
    pageConcurrency: fast ? 2 : 2,
  },

  brokenLinkProbeLimit: fast ? 10 : 16,
};

export function getInteractionProfile(name = "subpage") {
  return (
    ANALYSIS_CONFIG.interaction.profiles[name] ||
    ANALYSIS_CONFIG.interaction.profiles.subpage
  );
}
