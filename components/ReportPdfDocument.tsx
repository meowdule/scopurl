"use client";

import type { ReportJson } from "@/lib/types";
import {
  buildQualityProfile,
  buildReportKpi,
  buildPriorityImprovements,
} from "@/lib/qualityProfile";
import { buildPdfContext, pageAxeCount } from "@/lib/reportPdfData";
import { pdfExecutiveLine } from "@/lib/reportCopy";
import { RadarChart } from "@/components/RadarChart";
import { ScoreTierBadge, StatusBadge } from "@/components/ReportCharts";

type Props = {
  report: ReportJson;
};

export function ReportPdfDocument({ report }: Props) {
  const { summary, targetUrl, completedAt, pages, timing, crawlMeta } = report;
  const axes = buildQualityProfile(report);
  const priorities = buildPriorityImprovements(axes);
  const kpi = buildReportKpi(report);
  const { issues, seoChecklist } = buildPdfContext(report);
  const bd = summary.healthBreakdown;
  const profile = report.deviceProfile || crawlMeta?.deviceProfile;
  const applied = report.crawlLimits?.applied;

  const dateLabel = completedAt
    ? new Date(completedAt).toLocaleString("ko-KR")
    : "—";

  return (
    <article className="pdf-doc text-[#0f172a]">
      <section className="pdf-page pdf-cover">
        <div className="pdf-cover-accent" aria-hidden />
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

      <section className="pdf-page pdf-avoid-break">
        <h2 className="pdf-h2">Executive Summary</h2>
        <div className="pdf-exec-hero">
          <p className="pdf-exec-score">{summary.healthScore}</p>
          {summary.statusLabel && (
            <StatusBadge status={summary.statusLabel} />
          )}
        </div>
        <p className="pdf-lead">{pdfExecutiveLine(summary.statusLabel)}</p>

        {priorities.length > 0 && (
          <>
            <h3 className="pdf-h3">우선 개선 TOP3</h3>
            <div className="pdf-priority-row">
              {priorities.map((p, i) => (
                <div key={p.axis.key} className="pdf-priority-card pdf-avoid-break">
                  <span className="pdf-rank">{i + 1}</span>
                  <p className="font-semibold">{p.axis.label}</p>
                  <p className="text-2xl font-bold">{p.axis.score}점</p>
                  <p className="text-xs leading-relaxed text-[#64748b]">
                    {p.problemSummary}
                  </p>
                  <p className="pdf-gain">예상 +{p.expectedGain}점</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="pdf-kpi-row">
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
          <RadarChart axes={axes} size={240} />
        </div>
      </section>

      {priorities.length > 0 && (
        <section className="pdf-page">
          <h2 className="pdf-h2">우선 개선 권장 사항</h2>
          {priorities.map((p) => (
            <div key={p.axis.key} className="pdf-rec-block pdf-avoid-break">
              <h3 className="pdf-h3">{p.axis.label}</h3>
              <p>
                <strong>문제</strong> — {p.problemSummary}
              </p>
              <p>
                <strong>영향</strong> — {p.axis.label} 점수({p.axis.score}점)가
                종합 품질에 반영됩니다.
              </p>
              <p>
                <strong>권장 조치</strong>
              </p>
              <ul className="list-disc pl-5 text-sm">
                {p.actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <p className="pdf-gain">예상 효과: +{p.expectedGain}점</p>
            </div>
          ))}
        </section>
      )}

      <section className="pdf-page">
        <h2 className="pdf-h2">품질 프로필 상세</h2>
        <div className="pdf-axis-list">
          {axes.map((axis) => (
            <div key={axis.key} className="pdf-axis-row pdf-avoid-break">
              <div>
                <p className="font-semibold">{axis.label}</p>
                <p className="text-sm text-[#64748b]">{axis.cardDescription}</p>
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
          <div className="pdf-breakdown mt-5">
            {bd.contributions.map((c) => (
              <div key={c.category} className="pdf-breakdown-row">
                <span className="pdf-breakdown-label">{c.label}</span>
                <div className="pdf-breakdown-bar-track">
                  <div
                    className="pdf-breakdown-bar-fill"
                    style={{
                      width: `${Math.min(100, (c.weightedPoints / 30) * 100)}%`,
                    }}
                  />
                </div>
                <span className="pdf-breakdown-value">+{c.weightedPoints}</span>
              </div>
            ))}
            {bd.penaltyTotal > 0 && (
              <div className="pdf-breakdown-row">
                <span className="pdf-breakdown-label">감점</span>
                <div className="pdf-breakdown-bar-track">
                  <div className="pdf-breakdown-bar-fill pdf-breakdown-penalty" />
                </div>
                <span className="pdf-breakdown-value">−{bd.penaltyTotal}</span>
              </div>
            )}
            <div className="pdf-breakdown-final">
              <span>최종</span>
              <strong>{summary.healthScore}</strong>
            </div>
          </div>
        </section>
      )}

      {issues.length > 0 && (
        <section className="pdf-page">
          <h2 className="pdf-h2">발견된 이슈 상세</h2>
          {issues.slice(0, 14).map((issue) => (
            <div key={issue.id} className="pdf-issue-card pdf-avoid-break">
              <p className={`pdf-severity pdf-severity-${issue.severity}`}>
                {issue.severity.toUpperCase()}
              </p>
              <h3 className="font-semibold">{issue.title}</h3>
              <p className="text-sm">
                <strong>영향</strong> {issue.impact}
              </p>
              <p className="text-xs font-mono text-[#64748b]">{issue.location}</p>
              <p className="pdf-rec-box text-sm">{issue.recommendation}</p>
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
            {pages.map((p) => {
              const issueN =
                pageAxeCount(p) +
                (p.uiIssues?.filter((i) => i.severity !== "info").length ?? 0);
              return (
                <tr key={p.url}>
                  <td className="max-w-[180px] text-xs">{p.url}</td>
                  <td>{p.statusCode ?? "—"}</td>
                  <td>{p.lighthouse?.performance ?? "—"}</td>
                  <td>{pageAxeCount(p)}</td>
                  <td>{p.lighthouse?.seo ?? "—"}</td>
                  <td>{issueN}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="pdf-page">
        <h2 className="pdf-h2">SEO 분석</h2>
        <p className="mb-4 text-sm">
          현재 SEO 점수:{" "}
          <strong>{axes.find((a) => a.key === "seo")?.score ?? "—"}점</strong>
        </p>
        <ul className="pdf-seo-checklist">
          {seoChecklist.map((item) => (
            <li key={item.id} className="pdf-seo-item pdf-avoid-break">
              <span className={`pdf-seo-status pdf-seo-${item.status}`}>
                {seoStatusLabel(item.status)}
              </span>
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="text-xs text-[#64748b]">{item.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="pdf-page pdf-scope-page">
        <h2 className="pdf-h2">분석 범위</h2>
        <dl className="pdf-dl">
          <PdfDl label="분석 페이지" value={`${kpi.pageCount}개`} />
          <PdfDl label="발견 링크" value={`${kpi.linkCount}개`} />
          <PdfDl
            label="크롤 깊이"
            value={applied?.maxDepth != null ? String(applied.maxDepth) : "—"}
          />
          <PdfDl
            label="최대 페이지"
            value={applied?.maxPages != null ? String(applied.maxPages) : "—"}
          />
          <PdfDl label="추적 모드" value={applied?.traceMode ?? "—"} />
          <PdfDl
            label="분석 환경"
            value={
              profile === "mobile"
                ? "모바일 (390px)"
                : profile === "desktop"
                  ? "데스크톱 (1440px)"
                  : "—"
            }
          />
          {timing?.totalSeconds != null && (
            <PdfDl
              label="실행 시간"
              value={`${Math.round(timing.totalSeconds)}초`}
            />
          )}
          <PdfDl label="생성 시각" value={dateLabel} />
        </dl>
        <p className="pdf-footer-note">Generated by SCOPURL</p>
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

function PdfDl({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function seoStatusLabel(s: string) {
  if (s === "pass") return "충족";
  if (s === "warn") return "개선 권장";
  if (s === "fail") return "누락";
  return "확인 필요";
}
