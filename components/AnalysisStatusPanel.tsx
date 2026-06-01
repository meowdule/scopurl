"use client";

import type { QuickCheckResult, ReportPhase } from "@/lib/types";
import { assetUrl } from "@/lib/paths";

const PHASE_LABELS: Record<ReportPhase, string> = {
  queued: "대기열",
  quick: "빠른 점검",
  crawling: "페이지 수집",
  analyzing: "심층 분석",
  complete: "완료",
  failed: "실패",
};

type Props = {
  phase: ReportPhase | null;
  quick: Partial<QuickCheckResult> | null;
  estimatedWaitLabel?: string | null;
  failed?: boolean;
};

export function AnalysisStatusPanel({
  phase,
  quick,
  estimatedWaitLabel,
  failed,
}: Props) {
  if (!phase && !quick) return null;

  return (
    <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          분석 진행 상태
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {phase && (
            <span
              className={`rounded-full border px-3 py-1 text-xs ${
                failed
                  ? "border-red-500/40 text-red-200"
                  : "border-slate-600 text-slate-200"
              }`}
            >
              {PHASE_LABELS[phase]}
            </span>
          )}
          {estimatedWaitLabel && !failed && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
              {estimatedWaitLabel}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        빠른 신호는 백그라운드 작업이 게시하는 즉시 갱신됩니다. 크롤이 끝나면
        최종 리포트에 상세 결과가 표시됩니다.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <QuickRow label="URL valid" ok={quick?.validUrl} />
        <QuickRow label="DNS" ok={quick?.dnsOk} detail={quick?.dnsMessage} />
        <QuickRow
          label="HTTP reachable"
          ok={quick?.httpOk}
          detail={
            quick?.httpStatus != null ? `Status ${quick.httpStatus}` : undefined
          }
        />
        <QuickRow
          label="TLS certificate"
          ok={quick?.sslOk}
          detail={quick?.sslMessage}
        />
        <QuickRow
          label="Response time"
          detail={
            quick?.responseTimeMs != null
              ? `${quick.responseTimeMs} ms (homepage)`
              : "Pending"
          }
          pending={quick?.responseTimeMs == null}
        />
        <QuickRow
          label="Internal links (homepage)"
          detail={
            quick?.internalLinkCount != null
              ? `${quick.internalLinkCount} found`
              : "Pending"
          }
          pending={quick?.internalLinkCount == null}
        />
      </div>

      {quick?.screenshotRelativePath && (
        <div className="mt-5">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
            Homepage screenshot
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetUrl(`/${quick.screenshotRelativePath}`)}
            alt="Homepage capture"
            className="max-h-64 w-full rounded-lg border border-surface-border bg-black/40 object-contain object-left"
          />
        </div>
      )}
    </div>
  );
}

function QuickRow({
  label,
  ok,
  detail,
  pending,
}: {
  label: string;
  ok?: boolean;
  detail?: string;
  pending?: boolean;
}) {
  const isPending = pending || (ok === undefined && !detail);
  return (
    <div
      className={`rounded-lg border border-surface-border/80 bg-surface/60 px-4 py-3 ${
        isPending && ok !== false ? "animate-pulse" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-200">{label}</p>
        {ok === undefined ? (
          <span className="text-xs text-slate-500">
            {isPending ? "…" : "—"}
          </span>
        ) : ok ? (
          <span className="text-xs font-medium text-emerald-400">OK</span>
        ) : (
          <span className="text-xs font-medium text-amber-300">Issue</span>
        )}
      </div>
      {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
    </div>
  );
}
