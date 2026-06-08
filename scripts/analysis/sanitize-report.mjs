import { sanitizeNetworkUrl } from "./sanitize-network-url.mjs";

/** Prepare report.json for git publish (strip noisy URL query params). */
export function sanitizeReportForPublish(report) {
  const out = structuredClone(report);

  for (const page of out.pages || []) {
    for (const fr of page.failedRequests || []) {
      if (fr.url) fr.url = sanitizeNetworkUrl(fr.url);
    }
  }

  let text = JSON.stringify(out);
  // Belt-and-suspenders: GA/Facebook-style token patterns in any leftover string.
  text = text.replace(/EAA[A-Za-z0-9_-]{12,}/g, "[redacted]");
  return JSON.parse(text);
}
