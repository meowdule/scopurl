"use client";

import { useCallback, useRef, useState } from "react";
import { validateHttpUrl } from "@/lib/validateUrl";
import { checkDns } from "@/lib/dnsCheck";
import type { QuickCheckResult, ReportPhase, ReportJson } from "@/lib/types";
import {
  startAnalysis,
  type DeviceProfile,
  type TraceMode,
} from "@/lib/startAnalysis";
import {
  buildAnalysisOptions,
  DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_PAGES,
  DEFAULT_TRACE_MODE,
  FREE_MAX_PAGES,
} from "@/lib/analysisOptions";
import { fetchReport, fetchStatus } from "@/lib/pollReport";
import { formatStatusError } from "@/lib/analysisErrors";
import { AnalysisStatusPanel } from "@/components/AnalysisStatusPanel";
import { AnalysisWaitExperience } from "@/components/AnalysisWaitExperience";
import { DEFAULT_ANALYZE_URL } from "@/lib/config";
import { analyzeFormStrings as t } from "@/lib/uiStrings";

function newReportId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type AnalyzeFormProps = {
  onReportReady?: (report: ReportJson) => void;
  onAnalyzingChange?: (analyzing: boolean) => void;
  /** ??? ?? ? ? ? ?? ?? ???? */
  locked?: boolean;
};

export function AnalyzeForm({
  onReportReady,
  onAnalyzingChange,
  locked = false,
}: AnalyzeFormProps) {
  const [urlInput, setUrlInput] = useState("");
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>("desktop");
  const [maxPages, setMaxPages] = useState(DEFAULT_MAX_PAGES);
  const [maxDepth, setMaxDepth] = useState(DEFAULT_MAX_DEPTH);
  const [traceMode, setTraceMode] = useState<TraceMode>(DEFAULT_TRACE_MODE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [phase, setPhase] = useState<ReportPhase | null>(null);
  const [quick, setQuick] = useState<Partial<QuickCheckResult> | null>(null);
  const [estimatedWaitLabel, setEstimatedWaitLabel] = useState<string | null>(
    null,
  );
  const waitSectionRef = useRef<HTMLDivElement>(null);
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setReportId(null);
    setEstimatedWaitLabel(null);
    setPhase(null);
    setQuick(null);
    setPollStartedAt(null);
  }, []);

  const runInstantChecks = useCallback(async (normalizedUrl: string) => {
    const host = new URL(normalizedUrl).hostname;
    const dns = await checkDns(host);
    setQuick((q) => ({
      ...q,
      validUrl: true,
      dnsOk: dns.ok,
      dnsMessage: dns.message,
      errorCode: dns.ok ? undefined : ("dns_fail" as const),
    }));
    if (!dns.ok) {
      setError(formatStatusError("dns_fail", dns.message));
    }
  }, []);

  const pollLoop = useCallback(
    async (id: string) => {
      const started = Date.now();
      const maxMs = 45 * 60 * 1000;
      while (Date.now() - started < maxMs) {
        try {
          const status = await fetchStatus(id);
          if (status) {
            setPhase(status.phase);
            setEstimatedWaitLabel(status.estimatedWaitLabel || null);
            if (status.quick) setQuick(status.quick);
            if (status.phase === "complete") {
              const report = await fetchReport(id);
              if (report) {
                setBusy(false);
                onAnalyzingChange?.(false);
                setPhase(null);
                setQuick(null);
                setReportId(null);
                setEstimatedWaitLabel(null);
                onReportReady?.(report);
                return;
              }
            }
            if (status.phase === "failed") {
              setError(formatStatusError(status.errorCode, status.error));
              setBusy(false);
              onAnalyzingChange?.(false);
              return;
            }
          }
        } catch {
          /* transient network errors */
        }
        await new Promise((r) => setTimeout(r, 3500));
      }
      setError(formatStatusError("timeout", "Timed out waiting for the report."));
      setBusy(false);
      onAnalyzingChange?.(false);
    },
    [onReportReady, onAnalyzingChange],
  );

  const onAnalyze = useCallback(async () => {
    setError(null);
    const trimmed = urlInput.trim();
    const targetInput = trimmed || DEFAULT_ANALYZE_URL;
    if (!trimmed) {
      setUrlInput(DEFAULT_ANALYZE_URL);
    }
    const v = validateHttpUrl(targetInput);
    if (!v.ok || !v.normalized) {
      setError(v.error || "Invalid URL");
      return;
    }

    const id = newReportId();
    setReportId(id);
    setBusy(true);
    onAnalyzingChange?.(true);
    setPhase("queued");
    setQuick({ validUrl: true });
    setEstimatedWaitLabel(t.waitEstimate);

    setPollStartedAt(Date.now());

    requestAnimationFrame(() => {
      waitSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    await runInstantChecks(v.normalized);

    try {
      await startAnalysis(
        id,
        v.normalized,
        buildAnalysisOptions({
          deviceProfile,
          maxPages,
          maxDepth,
          traceMode,
        }),
      );
      void pollLoop(id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start analysis.";
      setError(msg);
      setBusy(false);
      onAnalyzingChange?.(false);
    }
  }, [
    deviceProfile,
    maxDepth,
    maxPages,
    onAnalyzingChange,
    pollLoop,
    runInstantChecks,
    traceMode,
    urlInput,
  ]);

  const showStatus = busy || (phase === "failed" && quick);
  const failed = phase === "failed";
  const formDisabled = busy || locked;

  return (
    <div className="space-y-6">
      <div
        className={`panel relative space-y-6 ${locked ? "opacity-60" : ""}`}
        aria-disabled={locked || undefined}
      >
      {locked && (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-panel bg-page/40" />
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          inputMode="url"
          placeholder="https://example.com"
          className="w-full flex-1 rounded-xl border border-card-border bg-page px-4 py-3.5 text-sm text-fg outline-none ring-accent/30 placeholder:text-fg-muted/70 focus:ring-2"
          value={urlInput}
          disabled={formDisabled}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void onAnalyze();
          }}
        />
        <button
          type="button"
          onClick={() => void onAnalyze()}
          disabled={busy}
          className="rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-cardSm transition hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? t.analyzing : "Analyze"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-fg">
        <span className="text-fg-muted">{t.deviceSize}</span>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="deviceProfile"
            value="desktop"
            checked={deviceProfile === "desktop"}
            disabled={formDisabled}
            onChange={() => setDeviceProfile("desktop")}
            className="accent-accent"
          />
          {t.desktop}
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="deviceProfile"
            value="mobile"
            checked={deviceProfile === "mobile"}
            disabled={formDisabled}
            onChange={() => setDeviceProfile("mobile")}
            className="accent-accent"
          />
          {t.mobile}
        </label>
      </div>

      <details className="rounded-xl border border-card-border bg-page-alt/60 px-4 py-3 text-sm">
        <summary className="cursor-pointer select-none font-medium text-fg">
          {t.advancedOptions}
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-fg-muted">
              {t.maxPages(FREE_MAX_PAGES)}
            </span>
            <input
              type="number"
              min={1}
              max={FREE_MAX_PAGES}
              value={maxPages}
              disabled={busy}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-card-border bg-card px-3 py-2 text-fg"
            />
          </label>
          <label className="block">
            <span className="text-xs text-fg-muted">{t.maxDepth}</span>
            <input
              type="number"
              min={0}
              max={10}
              value={maxDepth}
              disabled={formDisabled}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-card-border bg-card px-3 py-2 text-fg"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-fg-muted">{t.traceLabel}</span>
            <select
              value={traceMode}
              disabled={busy}
              onChange={(e) => setTraceMode(e.target.value as TraceMode)}
              className="mt-1 w-full rounded-lg border border-card-border bg-card px-3 py-2 text-fg"
            >
              <option value="failure">{t.traceFailure}</option>
              <option value="all">{t.traceAll}</option>
              <option value="off">{t.traceOff}</option>
            </select>
          </label>
        </div>
      </details>
      {locked && (
        <p className="text-center text-xs text-fg-muted">
          ???? ?? ????. ? ??? ?? ?? ????? ??? ?
          ????.
        </p>
      )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/40 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      {showStatus && (
        <div ref={waitSectionRef} className="wait-panel relative space-y-5 rounded-panel p-4 pt-5">
          {busy && !failed && <AnalysisWaitExperience active={busy} />}
          <AnalysisStatusPanel
            phase={phase}
            quick={quick}
            estimatedWaitLabel={estimatedWaitLabel}
            failed={failed}
            pollStartedAt={pollStartedAt ?? undefined}
          />
        </div>
      )}

      {reportId && !busy && error && (
        <button
          type="button"
          className="text-sm text-accent underline-offset-4 hover:underline"
          onClick={reset}
        >
          Clear
        </button>
      )}
    </div>
  );
}
