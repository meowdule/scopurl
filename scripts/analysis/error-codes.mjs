/**
 * Shared error classification for runner and QA.
 */
export function detectErrorCode(message, quick) {
  const m = String(message || "").toLowerCase();
  if (quick?.dnsOk === false) return "dns_fail";
  if (quick?.httpStatus === 403) {
    if (
      String(quick?.finalUrl || "").includes("cdn-cgi") ||
      m.includes("cloudflare")
    ) {
      return "cloudflare";
    }
    return "http_403";
  }
  if (m.includes("timeout") || m.includes("timed out") || m.includes("45000")) {
    return "timeout";
  }
  if (
    m.includes("cloudflare") ||
    String(quick?.finalUrl || "").includes("cdn-cgi")
  ) {
    return "cloudflare";
  }
  return "unknown";
}
