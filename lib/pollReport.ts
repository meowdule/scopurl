import type { ReportJson, ReportStatusFile } from "@/lib/types";
import { getConfiguredRepo } from "@/lib/config";
import { assetUrl } from "@/lib/paths";

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

function rawGithubUrl(reportId: string, file: "status.json" | "report.json"): string {
  const repo = getConfiguredRepo();
  return `https://raw.githubusercontent.com/${repo}/main/public/reports/${reportId}/${file}?t=${Date.now()}`;
}

async function fetchWithFallback<T>(
  reportId: string,
  file: "status.json" | "report.json",
): Promise<T | null> {
  const rel = `/reports/${reportId}/${file}`;
  const pages = await fetchJson<T>(assetUrl(rel));
  if (pages) return pages;
  return fetchJson<T>(rawGithubUrl(reportId, file));
}

export async function fetchStatus(
  reportId: string,
): Promise<ReportStatusFile | null> {
  return fetchWithFallback<ReportStatusFile>(reportId, "status.json");
}

export async function fetchReport(reportId: string): Promise<ReportJson | null> {
  return fetchWithFallback<ReportJson>(reportId, "report.json");
}
