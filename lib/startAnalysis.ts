import { getConfiguredRepo } from "@/lib/config";
import {
  buildAnalysisOptions,
  type AnalysisStartOptions,
  type DeviceProfile,
  type TraceMode,
} from "@/lib/analysisOptions";

export type StartMode = "dispatch" | "issue";
export type { AnalysisStartOptions, DeviceProfile, TraceMode };

function buildPayload(
  reportId: string,
  targetUrl: string,
  options: AnalysisStartOptions,
) {
  return {
    reportId,
    targetUrl,
    ...options,
    schemaVersion: 3,
    createdAt: new Date().toISOString(),
  };
}

async function dispatchAnalysis(
  reportId: string,
  targetUrl: string,
  options: AnalysisStartOptions,
  token: string,
): Promise<void> {
  const repo = getConfiguredRepo();
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error("Invalid repository configuration.");
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${name}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "sitescope-analyze",
        client_payload: buildPayload(reportId, targetUrl, options),
      }),
    },
  );

  if (res.status !== 204 && !res.ok) {
    const text = await res.text();
    throw new Error(
      `Could not start analysis (${res.status}). ${text.slice(0, 200)}`,
    );
  }
}

export function openAnalysisIssue(
  reportId: string,
  targetUrl: string,
  options: AnalysisStartOptions,
): void {
  const repo = getConfiguredRepo();
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error("Invalid repository configuration.");
  }

  const payload = JSON.stringify(
    buildPayload(reportId, targetUrl, options),
    null,
    2,
  );

  const params = new URLSearchParams({
    title: `[SiteScope] ${reportId}`,
    body: [
      "SiteScope analysis request (auto-processed).",
      "",
      "```json",
      payload,
      "```",
    ].join("\n"),
  });

  const url = `https://github.com/${owner}/${name}/issues/new?${params.toString()}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function startAnalysis(
  reportId: string,
  targetUrl: string,
  options: AnalysisStartOptions,
): Promise<StartMode> {
  const normalized = buildAnalysisOptions(options);
  const token = process.env.NEXT_PUBLIC_QUEUE_DISPATCH_TOKEN?.trim();
  if (token) {
    await dispatchAnalysis(reportId, targetUrl, normalized, token);
    return "dispatch";
  }
  openAnalysisIssue(reportId, targetUrl, normalized);
  return "issue";
}

export function hasDispatchToken(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_QUEUE_DISPATCH_TOKEN?.trim());
}