"use client";

import type { QuickCheckResult, ReportPhase } from "@/lib/types";
import { assetUrl } from "@/lib/paths";
import {
  CheckCircle2,
  Clock,
  Globe,
  Link2,
  Loader2,
  Shield,
  Timer,
  XCircle,
} from "lucide-react";

const PHASES: { id: ReportPhase; label: string }[] = [
  { id: "queued", label: "대기" },
  { id: "quick", label: "빠른 점검" },
  { id: "crawling", label: "수집" },
  { id: "analyzing", label: "심층 분석" },
  { id: "complete", label: "완료" },
];

const PHASE_LABELS: Record<ReportPhase, string> = {
  queued: "대기열 등록",
  quick: "빠른 연결 점검",
  crawling: "페이지 수집 중",
  analyzing: "심층 분석 중",
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

  const phaseIndex = phase
    ? PHASES.findIndex((p) => p.id === phase)
    : 0;
  const activeStep = phase === "failed" ? -1 : Math.max(0, phaseIndex);

  return (
    <div className="panel relative overflow-hidden">
      {!failed && phase && phase !== "complete" && (
        <div className="panel-loading pointer-events-none absolute inset-0" aria-hidden />
      )}

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-base font-bold text-fg">
            {!failed && phase !== "complete" && (
              <Loader2 className="h-5 w-5 animate-spin text-accent-dim" aria-hidden />
            )}
            {failed ? "분석을 완료하지 못했습니다" : "분석 진행 상태"}
          </p>
          {phase && (
            <p className="mt-1 text-sm text-fg-muted">
              {PHASE_LABELS[phase]}
              {estimatedWaitLabel && !failed && ` · ${estimatedWaitLabel}`}
            </p>
          )}
        </div>
        {phase && !failed && (
          <span className="rounded-full border border-accent-dim/30 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-dim">
            {PHASE_LABELS[phase]}
          </span>
        )}
      </div>

      {!failed && (
        <ol className="relative mt-6 flex justify-between gap-1">
          {PHASES.map((step, i) => {
            const done = i < activeStep;
            const current = i === activeStep;
            return (
              <li key={step.id} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                    done
                      ? "border-accent-dim bg-accent-dim text-white"
                      : current
                        ? "border-accent-dim bg-accent-soft text-accent-dim"
                        : "border-card-border bg-page-alt text-fg-muted"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className={`text-center text-[10px] font-medium leading-tight sm:text-xs ${
                    current ? "text-accent-dim" : "text-fg-muted"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <p className="relative mt-5 text-xs leading-relaxed text-fg-muted">
        아래 신호는 분석 서버가 업데이트하는 즉시 반영됩니다. 크롤이 끝나면
        상세 리포트가 이 페이지 아래에 표시됩니다.
      </p>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
        <QuickRow
          icon={Globe}
          label="URL 형식"
          ok={quick?.validUrl}
        />
        <QuickRow
          icon={Link2}
          label="DNS"
          ok={quick?.dnsOk}
          detail={quick?.dnsMessage}
        />
        <QuickRow
          icon={CheckCircle2}
          label="HTTP 연결"
          ok={quick?.httpOk}
          detail={
            quick?.httpStatus != null ? `상태 코드 ${quick.httpStatus}` : undefined
          }
        />
        <QuickRow
          icon={Shield}
          label="TLS 인증서"
          ok={quick?.sslOk}
          detail={quick?.sslMessage}
        />
        <QuickRow
          icon={Timer}
          label="응답 시간"
          detail={
            quick?.responseTimeMs != null
              ? `${quick.responseTimeMs} ms (홈)`
              : "측정 중…"
          }
          pending={quick?.responseTimeMs == null}
        />
        <QuickRow
          icon={Clock}
          label="내부 링크 (홈)"
          detail={
            quick?.internalLinkCount != null
              ? `${quick.internalLinkCount}개 발견`
              : "탐색 중…"
          }
          pending={quick?.internalLinkCount == null}
        />
      </div>

      {quick?.screenshotRelativePath && (
        <div className="relative mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
            홈페이지 미리보기
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetUrl(`/${quick.screenshotRelativePath}`)}
            alt="홈페이지 캡처"
            className="max-h-72 w-full rounded-panel border border-card-border bg-page object-contain object-left shadow-cardSm"
          />
        </div>
      )}
    </div>
  );
}

function QuickRow({
  icon: Icon,
  label,
  ok,
  detail,
  pending,
}: {
  icon: typeof Globe;
  label: string;
  ok?: boolean;
  detail?: string;
  pending?: boolean;
}) {
  const isPending = pending || (ok === undefined && !detail);

  return (
    <div
      className={`flex gap-3 rounded-xl border border-card-border bg-page-alt/50 px-4 py-3 ${
        isPending && ok !== false ? "animate-pulse" : ""
      }`}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          ok === true
            ? "text-accent-dim"
            : ok === false
              ? "text-amber-600"
              : "text-fg-muted"
        }`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-fg">{label}</p>
          {ok === undefined ? (
            <span className="text-xs text-fg-muted">
              {isPending ? "…" : "—"}
            </span>
          ) : ok ? (
            <CheckCircle2 className="h-4 w-4 text-accent-dim" aria-label="OK" />
          ) : (
            <XCircle className="h-4 w-4 text-amber-600" aria-label="Issue" />
          )}
        </div>
        {detail && (
          <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{detail}</p>
        )}
      </div>
    </div>
  );
}
