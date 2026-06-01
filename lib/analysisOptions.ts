export const TRACE_MODES = ["failure", "all", "off"] as const;

export type TraceMode = (typeof TRACE_MODES)[number];
export type DeviceProfile = "mobile" | "desktop";

export type AnalysisStartOptions = {
  deviceProfile: DeviceProfile;
  maxPages: number;
  maxDepth: number;
  traceMode: TraceMode;
};

export const FREE_MAX_PAGES = 20;
export const DEFAULT_MAX_PAGES = 20;
export const DEFAULT_MAX_DEPTH = 2;
export const DEFAULT_TRACE_MODE: TraceMode = "failure";

export function clampMaxPages(value: number | string | undefined): number {
  const n = Number(value);
  if (Number.isNaN(n)) return DEFAULT_MAX_PAGES;
  return Math.min(FREE_MAX_PAGES, Math.max(1, Math.round(n)));
}

export function clampMaxDepth(value: number | string | undefined): number {
  const n = Number(value);
  if (Number.isNaN(n)) return DEFAULT_MAX_DEPTH;
  return Math.min(10, Math.max(0, Math.round(n)));
}

export function parseTraceMode(value: unknown): TraceMode {
  if (value === "all" || value === "off" || value === "failure") return value;
  return DEFAULT_TRACE_MODE;
}

export function buildAnalysisOptions(
  partial: Partial<AnalysisStartOptions> = {},
): AnalysisStartOptions {
  return {
    deviceProfile: partial.deviceProfile === "mobile" ? "mobile" : "desktop",
    maxPages: clampMaxPages(partial.maxPages),
    maxDepth: clampMaxDepth(partial.maxDepth),
    traceMode: parseTraceMode(partial.traceMode),
  };
}