"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { ReportJson } from "@/lib/types";
import { fetchReport } from "@/lib/pollReport";
import { assetUrl } from "@/lib/paths";
import Link from "next/link";
import { ReportScoreDetails } from "@/components/ReportScoreDetails";
import { TimingSection } from "@/components/TimingSection";
import { GatedSection } from "@/components/GatedSection";
import { ExtendedReportCta } from "@/components/ExtendedReportCta";
import { ScoreCardShare } from "@/components/ScoreCardShare";
import { LeadModal } from "@/components/LeadModal";
import { LeadSuccessDialog } from "@/components/LeadSuccessDialog";
import {
  QUICK_SIGNAL_LABELS,
  humanizeQuickDetail,
} from "@/lib/reportCopy";

type Props =
  | { report: ReportJson; reportId?: never; onNewAnalysis?: () => void }
  | { reportId: string; report?: never; onNewAnalysis?: () => void };

export function ReportDashboard({
  reportId,
  report: reportProp,
  onNewAnalysis,
}: Props) {
  const [report, setReport] = useState<ReportJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [solutionSuccess, setSolutionSuccess] = useState(false);

  useEffect(() => {
    if (reportProp) {
      setReport(reportProp);
      setError(null);
      return;
    }
    if (!reportId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchReport(reportId);
        if (!cancelled) {
          if (!data) setError("리포트를 찾을 수 없습니다.");
          else setReport(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "리포트를 불러오지 못했습니다.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId, reportProp]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-red-700">{error}</p>
        <Link href={assetUrl("/")} className="mt-4 inline-block text-accent-dim">
          홈으로
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-fg-muted">
        리포트 불러오는 중…
      </div>
    );
  }

  const rid = report.reportId;
  const { pages, quick, targetUrl, brokenLinks, crawlMeta, timing } = report;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 print:text-black">
      {onNewAnalysis ? (
        <button
          type="button"
          onClick={onNewAnalysis}
          className="text-sm font-medium text-accent-dim hover:underline print:hidden"
        >
          ← 새 분석
        </button>
      ) : (
        <Link
          href={assetUrl("/")}
          className="text-sm font-medium text-accent-dim hover:underline print:hidden"
        >
          ← 새 분석
        </Link>
      )}

      <div className="print:hidden">
        <ScoreCardShare report={report} />
      </div>

      <ReportScoreDetails report={report} />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricTile label="분석한 페이지" value={String(pages.length)} />
        <MetricTile
          label="발견한 내부 링크"
          value={
            crawlMeta?.discoveryStats?.linksDiscovered != null
              ? String(crawlMeta.discoveryStats.linksDiscovered)
              : quick.internalLinkCount != null
                ? String(quick.internalLinkCount)
                : "—"
          }
        />
        <MetricTile
          label="클릭·탭 시도"
          value={
            crawlMeta?.discoveryStats?.clicksRecorded != null
              ? String(crawlMeta.discoveryStats.clicksRecorded)
              : "—"
          }
        />
      </section>

      <GatedSection
        title="주요 이용 흐름"
        description="홈에서 이동·노출된 사용자 경로는 솔루션 문의 후 담당자가 안내해 드립니다."
        ctaLabel="솔루션 문의"
        onCta={() => setSolutionOpen(true)}
      >
        {crawlMeta?.interactionFlow && (
          <pre className="font-mono text-xs text-fg-muted">
            {crawlMeta.interactionFlow}
          </pre>
        )}
      </GatedSection>

      <GatedSection
        title="입력 양식 정보"
        description="폼·입력 필드 분석은 영업 상담을 통해 제공됩니다."
        ctaLabel="솔루션 문의"
        onCta={() => setSolutionOpen(true)}
      />

      {timing && <TimingSection timing={timing} />}

      <section className="panel mt-10 print:hidden">
        <h2 className="text-sm font-semibold text-fg">빠른 연결 점검</h2>
        <p className="mt-1 text-sm text-fg-muted">
          분석 시작 직후 확인한 기본 연결 상태입니다.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Signal
            title={QUICK_SIGNAL_LABELS.dns.title}
            ok={quick.dnsOk}
            okLabel={QUICK_SIGNAL_LABELS.dns.ok}
            failLabel={QUICK_SIGNAL_LABELS.dns.fail}
            detail={humanizeQuickDetail("dns", quick.dnsMessage)}
          />
          <Signal
            title={QUICK_SIGNAL_LABELS.http.title}
            ok={quick.httpOk}
            okLabel={QUICK_SIGNAL_LABELS.http.ok}
            failLabel={QUICK_SIGNAL_LABELS.http.fail}
            detail={humanizeQuickDetail(
              "http",
              undefined,
              quick.httpStatus,
            )}
          />
          <Signal
            title={QUICK_SIGNAL_LABELS.tls.title}
            ok={quick.sslOk}
            okLabel={QUICK_SIGNAL_LABELS.tls.ok}
            failLabel={QUICK_SIGNAL_LABELS.tls.fail}
            detail={humanizeQuickDetail("tls", quick.sslMessage)}
          />
        </div>
      </section>

      <section className="panel mt-10 overflow-x-auto">
        <h2 className="text-sm font-semibold text-fg">분석한 페이지</h2>
        <p className="mt-1 text-sm text-fg-muted">
          각 페이지의 접속 상태와 품질 점수 요약입니다.
        </p>
        <table className="mt-4 w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-card-border text-fg-muted">
              <th className="py-2 pr-4 font-medium">주소</th>
              <th className="py-2 pr-4 font-medium">접속</th>
              <th className="py-2 pr-4 font-medium">성능</th>
              <th className="py-2 pr-4 font-medium">접근성 이슈</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr
                key={p.url}
                className="border-b border-card-border/80 text-fg"
              >
                <td className="max-w-xs truncate py-3 pr-4 text-xs text-fg-muted">
                  {p.url}
                </td>
                <td className="py-3 pr-4 tabular-nums">
                  {p.statusCode ?? "—"}
                </td>
                <td className="py-3 pr-4 tabular-nums">
                  {p.lighthouse?.performance ?? "—"}
                </td>
                <td className="py-3 pr-4 tabular-nums">
                  {(p.axeViolations || []).reduce((s, v) => s + v.nodes, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {brokenLinks.length > 0 && (
        <section className="panel mt-10">
          <h2 className="text-sm font-semibold text-fg">깨진 링크</h2>
          <ul className="mt-4 space-y-2 text-sm text-fg-muted">
            {brokenLinks.slice(0, 20).map((b) => (
              <li
                key={`${b.from}-${b.to}`}
                className="rounded-lg border border-card-border bg-page px-4 py-3"
              >
                <span className="text-xs text-fg-muted">{b.from}</span>
                <span className="mx-2 text-fg">→</span>
                <span className="text-xs text-fg">{b.to}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="print:hidden">
        <ExtendedReportCta defaultSiteUrl={targetUrl} />
      </div>

      <LeadModal
        open={solutionOpen}
        mode="solution"
        reportId={rid}
        defaultSiteUrl={targetUrl}
        onClose={() => setSolutionOpen(false)}
        onSuccess={() => setSolutionSuccess(true)}
      />
      <LeadSuccessDialog
        open={solutionSuccess}
        onClose={() => setSolutionSuccess(false)}
      />
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow-cardSm">
      <p className="text-xs font-medium text-fg-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-fg">{value}</p>
    </div>
  );
}

function Signal({
  title,
  ok,
  okLabel,
  failLabel,
  detail,
}: {
  title: string;
  ok?: boolean;
  okLabel: string;
  failLabel: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-page-alt/50 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-fg">{title}</span>
        {ok === undefined ? (
          <span className="text-xs text-fg-muted">—</span>
        ) : ok ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-dim">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {okLabel}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
            <XCircle className="h-4 w-4" aria-hidden />
            {failLabel}
          </span>
        )}
      </div>
      {detail && (
        <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{detail}</p>
      )}
    </div>
  );
}
