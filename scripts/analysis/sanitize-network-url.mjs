/** Drop query/hash from captured network URLs (avoids secret-scan false positives). */
export function sanitizeNetworkUrl(raw) {
  if (!raw || typeof raw !== "string") return raw;
  try {
    if (raw.startsWith("intent:")) {
      const trimmed = raw.split("?")[0];
      return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
    }
    const u = new URL(raw);
    const base = `${u.origin}${u.pathname}`;
    return base.length > 280 ? `${base.slice(0, 280)}…` : base;
  } catch {
    const stripped = raw.split("?")[0].split("#")[0];
    return stripped.length > 280 ? `${stripped.slice(0, 280)}…` : stripped;
  }
}
