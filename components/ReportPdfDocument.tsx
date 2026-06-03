"use client";

import type { ReportJson } from "@/lib/types";
import {
  buildQualityProfile,
  buildReportKpi,
  buildPriorityImprovements,
} from "@/lib/qualityProfile";
import { buildPdfContext, pageAxeCount } from "@/lib/reportPdfData";
import {
  humanizeQuickDetail,
  pdfExecutiveLine,
  QUICK_SIGNAL_LABELS,
} from "@/lib/reportCopy";
import { RadarChart } from "@/components/RadarChart";
import { ScoreTierBadge, StatusBadge } from "@/components/ReportCharts";

type Props = {
  report: ReportJson;
};

export function ReportPdfDocument({ report }: Props) {
  const { summary, targetUrl, completedAt, quick, pages, timing, crawlMeta } =
    report;
  const axes = buildQualityProfile(report);
  const priorities = buildPriorityImprovements(axes);
  const kpi = buildReportKpi(report);
  const { issues, seoChecklist } = buildPdfContext(report);
  const bd = summary.healthBreakdown;
  const profile = report.deviceProfile || crawlMeta?.deviceProfile;

  const dateLabel = completedAt
    ? new Date(completedAt).toLocaleString("ko-KR")
    : "—";

  return (
    <article className="pdf-doc text-[#0f172a]">
      <section className="pdf-page pdf-cover">
        <p className="pdf-eyebrow">SCOPURL</p>
        <h1 className="pdf-cover-title">Website Quality Report</h1>
        <p className="pdf-cover-url">{targetUrl}</p>
        <p className="pdf-cover-meta">분석일 {dateLabel}</p>
        <div className="pdf-cover-score-row">
          <span className="pdf-cover-score">{summary.healthScore}</span>
          {summary.statusLabel && (
            <StatusBadge status={summary.statusLabel} />
          )}
        </div>
        <p className="pdf-cover-tagline">사이트 품질 진단 보고서</p>
      </section>

      <section className="pdf-page">
        <h2 className="pdf-h2">Executive Summary</h2>
        <p className="pdf-lead">{pdfExecutiveLine(summary.statusLabel)}</p>
        <div className="pdf-kpi-row">
          <PdfKpi label="종합 점수" value={String(summary.healthScore)} />
          <PdfKpi label="분석 페이지" value={`${kpi.pageCount}개`} />
          <PdfKpi label="발견 이슈" value={`${kpi.issueCount}건`} />
          <PdfKpi
            label="분석 시간"
            value={
              kpi.analysisSeconds != null
                ? `${Math.round(kpi.analysisSeconds)}초`
                : "—"
            }
          />
        </div>
        <div className="pdf-radar-wrap">
          <RadarChart axes={axes} size={220} />
        </div>
        {priorities.length > 0 && (
          <>
            <h3 className="pdf-h3">우선 개선 TOP3</h3>
            <div className="pdf-priority-row">
              {priorities.map((p) => (
                <div key={p.axis.key} className="pdf-priority-card">
                  <p className="font-semibold">{p.axis.label}</p>
                  <p className="text-2xl font-bold">{p.axis.score}점</p>
                  <p className="text-xs text-[#64748b]">
                    예상 +{p.expectedGain}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="pdf-page">
        <h2 className="pdf-h2">품질 프로필 상세</h2>
        <div className="pdf-axis-list">
          {axes.map((axis) => (
            <div key={axis.key} className="pdf-axis-row">
              <div>
                <p className="font-semibold">{axis.label}</p>
                <p className="text-sm text-[#64748b]">{axis.summary}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{axis.score}점</p>
                <ScoreTierBadge tier={axis.tier} label={axis.tierLabel} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {bd && (
        <section className="pdf-page">
          <h2 className="pdf-h2">점수 산정 근거</h2>
          <p className="text-sm text-[#64748b]">{bd.formula}</p>
          <table className="pdf-table mt-4">
            <thead>
              <tr>
                <th>영역</th>
                <th>기여</th>
              </tr>
            </thead>
            <tbody>
              {bd.contributions.map((c) => (
                <tr key={c.category}>
                  <td>{c.label}</td>
                  <td>+{c.weightedPoints}</td>
                </tr>
              ))}
              {bd.penaltyTotal > 0 && (
                <tr>
                  <td>감점</td>
                  <td>−{bd.penaltyTotal}</td>
                </tr>
              )}
              <tr className="font-bold">
                <td>최종</td>
                <td>{summary.healthScore}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {priorities.length > 0 && (
        <section className="pdf-page">
          <h2 className="pdf-h2">우선 개선 권장 사항</h2>
          {priorities.map((p) => (
            <div key={p.axis.key} className="pdf-issue-block">
              <h3 className="pdf-h3">{p.axis.label}</h3>
              <p>
                <strong>문제</strong> — {p.axis.score}점으로 개선 여지가 있습니다.
              </p>
              <p>
                <strong>영향</strong> — 사용자 경험·검색 노출에 영향을 줄 수 있습니다.
              </p>
              <p>
                <strong>권장 조치</strong>
              </p>
              <ul className="list-disc pl-5 text-sm">
                {p.actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <p className="text-sm text-[#00a85f]">
                예상 효과: +{p.expectedGain}점
              </p>
            </div>
          ))}
        </section>
      )}

      {issues.length > 0 && (
        <section className="pdf-page">
          <h2 className="pdf-h2">발견된 이슈 상세</h2>
          {issues.slice(0, 12).map((issue) => (
            <div key={issue.id} className="pdf-issue-block">
              <p className="pdf-severity">{issue.severity.toUpperCase()}</p>
              <h3 className="font-semibold">{issue.title}</h3>
              <p className="text-sm">
                <strong>영향</strong> {issue.impact}
              </p>
              <p className="text-sm">
                <strong>위치</strong> {issue.location}
              </p>
              <p className="text-sm">
                <strong>권장</strong> {issue.recommendation}
              </p>
            </div>
          ))}
        </section>
      )}

      <section className="pdf-page">
        <h2 className="pdf-h2">페이지별 진단</h2>
        <table className="pdf-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>상태</th>
              <th>성능</th>
              <th>접근성</th>
              <th>SEO</th>
              <th>이슈</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.url}>
                <td className="max-w-[200px] text-xs">{p.url}</td>
                <td>{p.statusCode ?? "—"}</td>
                <td>{p.lighthouse?.performance ?? "—"}</td>
                <td>{pageAxeCount(p)}</td>
                <td>{p.lighthouse?.seo ?? "—"}</td>
                <td>
                  {pageAxeCount(p) +
                    (p.uiIssues?.filter((i) => i.severity !== "info").length ??
                      0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="pdf-page">
        <h2 className="pdf-h2">접근성 분석</h2>
        {pages.flatMap((p) =>
          (p.axeViolations || []).map((v) => (
            <div key={`${p.url}-${v.id}`} className="pdf-issue-block">
              <p className="pdf-severity">{(v.impact || "moderate").toUpperCase()}</p>
              <p className="font-semibold">{v.description}</p>
              <p className="text-sm text-[#64748b]">{p.url}</p>
            </div>
          )),
        )}
        {pages.every((p) => !(p.axeViolations?.length)) && (
          <p className="text-sm text-[#64748b]">접근성 위반 항목이 없습니다.</p>
        )}
      </section>

      <section className="pdf-page">
        <h2 className="pdf-h2">UX 분석</h2>
        {pages.flatMap((p) =>
          (p.uiIssues || [])
            .filter((i) => i.severity !== "info")
            .map((u) => (
              <div key={u.id} className="pdf-issue-block">
                <p className="font-semibold">{u.message}</p>
                <p className="text-sm">{u.friendlyMessage || u.userImpact}</p>
                <p className="text-xs text-[#64748b]">
                  {p.url} · {u.viewport}
                </p>
              </div>
            )),
        )}
        {summary.mobileWarnings.length > 0 && (
          <ul className="mt-4 list-disc pl-5 text-sm">
            {summary.mobileWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="pdf-page">
        <h2 className="pdf-h2">SEO 분석</h2>
        <p className="mb-4 text-sm">
          현재 SEO 점수:{" "}
          <strong>{axes.find((a) => a.key === "seo")?.score ?? "—"}점</strong>
        </p>
        <table className="pdf-table">
          <thead>
            <tr>
              <th>항목</th>
              <th>상태</th>
              <th>설명</th>
            </tr>
          </thead>
          <tbody>
            {seoChecklist.map((item) => (
              <tr key={item.id}>
                <td>{item.label}</td>
                <td>{seoStatusLabel(item.status)}</td>
                <td className="text-xs">{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="pdf-page">
        <h2 className="pdf-h2">기술 진단</h2>
        <ul className="space-y-2 text-sm">
          <li>
            {QUICK_SIGNAL_LABELS.dns.title}:{" "}
            {quick.dnsOk ? QUICK_SIGNAL_LABELS.dns.ok : QUICK_SIGNAL_LABELS.dns.fail}
            {quick.dnsMessage && ` — ${humanizeQuickDetail("dns", quick.dnsMessage)}`}
          </li>
          <li>
            {QUICK_SIGNAL_LABELS.http.title}:{" "}
            {quick.httpOk ? QUICK_SIGNAL_LABELS.http.ok : QUICK_SIGNAL_LABELS.http.fail}
            {quick.httpStatus != null && ` (${quick.httpStatus})`}
          </li>
          <li>
            {QUICK_SIGNAL_LABELS.tls.title}:{" "}
            {quick.sslOk ? QUICK_SIGNAL_LABELS.tls.ok : QUICK_SIGNAL_LABELS.tls.fail}
          </li>
          <li>응답 시간: {quick.responseTimeMs ?? "—"}ms</li>
          <li>스크립트 오류: {summary.totalConsoleErrors}건</li>
          <li>로딩 실패: {summary.totalFailedRequests}건</li>
        </ul>
      </section>

      <section className="pdf-page">
        <h2 className="pdf-h2">분석 범위</h2>
        <ul className="space-y-1 text-sm text-[#64748b]">
          <li>분석 페이지: {kpi.pageCount}개</li>
          <li>
            크롤 깊이: {report.crawlLimits?.applied?.maxDepth ?? "—"} / 최대 페이지:{" "}
            {report.crawlLimits?.applied?.maxPages ?? "—"}
          </li>
          <li>추적 모드: {report.crawlLimits?.applied?.traceMode ?? "—"}</li>
          <li>
            분석 환경:{" "}
            {profile === "mobile"
              ? "모바일 (390px)"
              : profile === "desktop"
                ? "데스크톱 (1440px)"
                : "—"}
          </li>
          {timing?.totalSeconds != null && (
            <li>실행 시간: {Math.round(timing.totalSeconds)}초</li>
          )}
        </ul>
        <p className="mt-8 text-xs text-[#94a3b8]">
          Generated by SCOPURL · {dateLabel}
        </p>
      </section>
    </article>
  );
}

function PdfKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="pdf-kpi">
      <p className="text-xs text-[#64748b]">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function seoStatusLabel(s: string) {
  if (s === "pass") return "충족";
  if (s === "warn") return "개선 권장";
  if (s === "fail") return "미흡";
  return "확인 필요";
}
