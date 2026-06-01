"use client";

import { useEffect, useState } from "react";
import type { ReportJson } from "@/lib/types";
import { fetchReport } from "@/lib/pollReport";
import { assetUrl } from "@/lib/paths";
import Link from "next/link";
import { DonutChart, ProgressBar } from "@/components/ReportCharts";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { TimingSection } from "@/components/TimingSection";
import { GatedSection } from "@/components/GatedSection";
import { PdfDownloadButton } from "@/components/PdfDownloadButton";
import { ExtendedReportCta } from "@/components/ExtendedReportCta";
import { ScoreCardShare } from "@/components/ScoreCardShare";
import { LeadModal } from "@/components/LeadModal";
import { LeadSuccessDialog } from "@/components/LeadSuccessDialog";

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
          if (!data) setError("Report not found yet.");
          else setReport(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load report.");
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
        <p className="text-red-300">{error}</p>
        <Link href={assetUrl("/")} className="mt-4 inline-block text-accent">
          Back home
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-fg-muted">
        Loading report…
      </div>
    );
  }

  const rid = report.reportId;
  const { summary, pages, quick, targetUrl, brokenLinks, crawlMeta, timing } =
    report;
  const cats = summary.categoryScores;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 print:text-black">
      {onNewAnalysis ? (
        <button
          type="button"
          onClick={onNewAnalysis}
          className="text-sm text-accent hover:underline print:hidden"
        >
          ← 새 분석
        </button>
      ) : (
        <Link
          href={assetUrl("/")}
          className="text-sm text-accent hover:underline print:hidden"
        >
          ← 새 분석
        </Link>
      )}

      <header className="mt-4 border-b border-surface-border pb-8">
        <p className="text-xs uppercase tracking-widest text-accent">
          scopurl 리포트
        </p>
        <h1 className="mt-2 break-all text-2xl font-semibold text-fg sm:text-3xl">
          {targetUrl}
        </h1>
        <div className="mt-4 flex flex-wrap gap-3 print:hidden">
          <PdfDownloadButton reportId={rid} targetUrl={targetUrl} />
          {(report.deviceProfile || crawlMeta?.deviceProfile) && (
            <span className="rounded-full border border-surface-border px-3 py-1 text-xs text-fg-muted">
              {(report.deviceProfile || crawlMeta?.deviceProfile) === "mobile"
                ? "모바일 분석"
                : "데스크톱 분석"}
            </span>
          )}
        </div>
      </header>

      <ExecutiveSummary report={report} />

      {cats && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
            <h2 className="text-sm font-semibold text-fg">카테고리별 점수</h2>
            <div className="mt-4 grid gap-4">
              <ProgressBar value={cats.performance} label="성능 · 로딩 속도" />
              <ProgressBar
                value={cats.accessibility}
                label="접근성 · 모두가 쓰기 쉬운지"
              />
              <ProgressBar value={cats.ux} label="사용성 · 화면·버튼 배치" />
              <ProgressBar
                value={cats.seo}
                label="검색·공유 · 검색·미리보기"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2">
            <DonutChart value={cats.performance} label="성능" />
            <DonutChart value={cats.accessibility} label="접근성" />
            <DonutChart value={cats.ux} label="UX" />
            <DonutChart value={cats.seo} label="SEO" />
          </div>
        </section>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricTile label="탐색한 페이지" value={String(pages.length)} />
        <MetricTile
          label="크롤 대상"
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
        title="주요 흐름"
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
        title="입력 데이터"
        description="폼·입력 필드 메타 정보는 영업 상담을 통해 제공됩니다."
        ctaLabel="솔루션 문의"
        onCta={() => setSolutionOpen(true)}
      />

      {timing && <TimingSection timing={timing} />}

      <section className="mt-10 print:hidden">
        <h2 className="text-lg font-semibold text-fg">Quick signals</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Signal label="DNS" ok={quick.dnsOk} detail={quick.dnsMessage} />
          <Signal
            label="HTTP"
            ok={quick.httpOk}
            detail={
              quick.httpStatus != null ? `Status ${quick.httpStatus}` : undefined
            }
          />
          <Signal label="TLS" ok={quick.sslOk} detail={quick.sslMessage} />
        </div>
      </section>

      <section className="mt-12 overflow-x-auto">
        <h2 className="text-lg font-semibold text-fg">Pages crawled</h2>
        <table className="mt-4 w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-fg-muted">
              <th className="py-2 pr-4">URL</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">성능</th>
              <th className="py-2 pr-4">접근성 이슈</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr
                key={p.url}
                className="border-b border-surface-border/60 text-slate-200"
              >
                <td className="max-w-xs truncate py-3 pr-4 font-mono text-xs">
                  {p.url}
                </td>
                <td className="py-3 pr-4">{p.statusCode ?? "—"}</td>
                <td className="py-3 pr-4">
                  {p.lighthouse?.performance ?? "—"}
                </td>
                <td className="py-3 pr-4">
                  {(p.axeViolations || []).reduce((s, v) => s + v.nodes, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {brokenLinks.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-fg">Broken links</h2>
          <ul className="mt-4 space-y-2 text-sm text-fg-muted">
            {brokenLinks.slice(0, 20).map((b) => (
              <li
                key={`${b.from}-${b.to}`}
                className="rounded-lg border border-surface-border bg-surface-raised px-4 py-3"
              >
                <span className="font-mono text-xs text-fg-muted">{b.from}</span>
                <span className="mx-2">→</span>
                <span className="font-mono text-xs">{b.to}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="print:hidden">
        <ScoreCardShare report={report} />
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
    <div className="rounded-xl border border-surface-border bg-surface-raised p-5">
      <p className="text-xs uppercase tracking-wide text-fg-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-fg">{value}</p>
    </div>
  );
}

function Signal({
  label,
  ok,
  detail,
}: {
  label: string;
  ok?: boolean;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-surface-border/80 bg-surface/60 px-4 py-3">
      <div className="flex justify-between gap-2">
        <span className="text-sm text-slate-200">{label}</span>
        {ok === undefined ? (
          <span className="text-xs text-fg-muted">—</span>
        ) : ok ? (
          <span className="text-xs text-emerald-400">OK</span>
        ) : (
          <span className="text-xs text-amber-300">Issue</span>
        )}
      </div>
      {detail && <p className="mt-1 text-xs text-fg-muted">{detail}</p>}
    </div>
  );
}
