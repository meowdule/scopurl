"use client";

import Image from "next/image";
import type { ReportJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";
import {
  buildQualityProfile,
  buildReportKpi,
  buildPriorityImprovements,
} from "@/lib/qualityProfile";
import { buildPdfContext, pageAxeCount, type ReportIssue } from "@/lib/reportPdfData";
import { pdfExecutiveLine, shareStatusLabelEn } from "@/lib/reportCopy";
import { PDF_AXIS_TINT, PDF_PRIORITY_ACCENT } from "@/lib/pdfTheme";
import { RadarChart } from "@/components/RadarChart";
import { ScoreTierBadge } from "@/components/ReportCharts";
import {
  ReportIcon,
  axisIcon,
  Clock,
  FileText,
  Layers,
  AlertTriangle,
  Timer,
  Gauge,
  Search,
  Globe,
  Wrench,
  MapPin,
  Accessibility,
} from "@/lib/reportIcons";

type Props = { report: ReportJson };

export function ReportPdfDocument({ report }: Props) {
  const { summary, targetUrl, completedAt, pages, timing, crawlMeta } = report;
  const axes = buildQualityProfile(report);
  const priorities = buildPriorityImprovements(axes);
  const kpi = buildReportKpi(report);
  const { issues, seoChecklist } = buildPdfContext(report);
  const bd = summary.healthBreakdown;
  const profile = report.deviceProfile || crawlMeta?.deviceProfile;
  const applied = report.crawlLimits?.applied;

  const dateShort = completedAt
    ? new Date(completedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "—";
  const statusEn = shareStatusLabelEn(summary.statusLabel);

  return (
    <article className="pdf-doc">
      {/* ── 표지 ── */}
      <section className="pdf-sheet pdf-cover-dark">
        <Image
          src={assetUrl("/favicon.png")}
          alt=""
          width={480}
          height={480}
          className="pdf-cover-watermark-lg"
          unoptimized
        />
        <div className="pdf-cover-body-dark">
          <Image
            src={assetUrl("/favicon.png")}
            alt=""
            width={64}
            height={64}
            className="pdf-cover-favicon-lg"
            unoptimized
          />
          <p className="pdf-cover-brand">SCOPURL</p>
          <h1 className="pdf-cover-title-dark">Website Quality Report</h1>
          <p className="pdf-cover-url-dark">{targetUrl}</p>
          <p className="pdf-cover-score-dark">{summary.healthScore}</p>
          <span className="pdf-cover-badge-premium">{statusEn}</span>
          <p className="pdf-cover-date-dark">Generated {dateShort}</p>
        </div>
      </section>

      {/* ── Executive Summary ── */}
      <section className="pdf-sheet pdf-sheet-tint">
        <PdfSectionHeader icon={FileText} title="Executive Summary" />
        <p className="pdf-lead">{pdfExecutiveLine(summary.statusLabel)}</p>

        <div className="pdf-exec-split">
          <div className="pdf-exec-score-panel pdf-avoid-break">
            <p className="pdf-exec-score-num">{summary.healthScore}</p>
            <span className="pdf-exec-badge">{statusEn}</span>
            <p className="pdf-exec-score-caption">Website Health Score</p>
          </div>
          <div className="pdf-exec-radar-panel pdf-avoid-break">
            <RadarChart axes={axes} size={220} />
          </div>
        </div>

        {priorities.length > 0 && (
          <>
            <h3 className="pdf-h3-accent">우선 개선 TOP3</h3>
            <div className="pdf-priority-row">
              {priorities.map((p, i) => {
                const accent = PDF_PRIORITY_ACCENT[p.axis.key];
                return (
                  <div
                    key={p.axis.key}
                    className="pdf-priority-card-accent pdf-avoid-break"
                    style={{
                      borderTopColor: accent.bar,
                      background: accent.bg,
                    }}
                  >
                    <span className="pdf-rank">{i + 1}</span>
                    <p className="font-semibold">{p.axis.label}</p>
                    <p className="text-2xl font-bold">{p.axis.score}점</p>
                    <p className="text-[10px] leading-snug text-[#475569]">
                      {p.problemSummary}
                    </p>
                    <p className="pdf-gain">예상 +{p.expectedGain}점</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="pdf-kpi-row">
          <PdfKpi icon={Layers} label="분석 페이지" value={`${kpi.pageCount}개`} />
          <PdfKpi icon={AlertTriangle} label="발견 이슈" value={`${kpi.issueCount}건`} />
          <PdfKpi
            icon={Timer}
            label="분석 시간"
            value={
              kpi.analysisSeconds != null
                ? `${Math.round(kpi.analysisSeconds)}초`
                : "—"
            }
          />
        </div>
      </section>

      {/* ── 품질 프로필 + 점수 산정 ── */}
      <section className="pdf-sheet">
        <PdfSectionHeader icon={Gauge} title="품질 프로필 상세" />
        <div className="pdf-axis-grid">
          {axes.map((axis) => {
            const tint = PDF_AXIS_TINT[axis.key];
            return (
              <div
                key={axis.key}
                className="pdf-axis-card pdf-avoid-break"
                style={{
                  background: tint.bg,
                  borderColor: tint.border,
                }}
              >
                <div
                  className="pdf-axis-card-accent"
                  style={{ background: tint.accent }}
                />
                <ReportIcon
                  icon={axisIcon(axis.key)}
                  size={18}
                  className="pdf-axis-card-icon"
                  strokeWidth={2}
                />
                <p className="pdf-axis-card-label">{axis.label}</p>
                <p className="pdf-axis-card-score">{axis.score}</p>
                <ScoreTierBadge tier={axis.tier} label={axis.tierLabel} />
                <p className="pdf-axis-card-desc">{axis.cardDescription}</p>
              </div>
            );
          })}
        </div>

        {bd && (
          <>
            <PdfSectionHeader icon={FileText} title="점수 산정 근거" spaced />
            <p className="pdf-breakdown-intro">
              <strong>{summary.healthScore}점</strong>은 성능·접근성·사용성·SEO 영역의
              가중치 기반으로 계산되었습니다.
              {bd.penaltyTotal > 0 && ` (감점 −${bd.penaltyTotal}점 포함)`}
            </p>
            {bd.formula && (
              <p className="pdf-breakdown-formula">{bd.formula}</p>
            )}
            <div className="pdf-breakdown">
              {bd.contributions.map((c) => (
                <div key={c.category} className="pdf-breakdown-row">
                  <span>{c.label}</span>
                  <div className="pdf-breakdown-bar-track">
                    <div
                      className="pdf-breakdown-bar-fill"
                      style={{
                        width: `${Math.min(100, (c.weightedPoints / 30) * 100)}%`,
                      }}
                    />
                  </div>
                  <span>+{c.weightedPoints}</span>
                </div>
              ))}
              {bd.penaltyTotal > 0 && (
                <div className="pdf-breakdown-row">
                  <span>감점</span>
                  <div className="pdf-breakdown-bar-track">
                    <div className="pdf-breakdown-bar-fill pdf-breakdown-penalty" />
                  </div>
                  <span>−{bd.penaltyTotal}</span>
                </div>
              )}
            </div>
            <div className="pdf-breakdown-final-hero">
              <span className="pdf-breakdown-final-label">최종 점수</span>
              <span className="pdf-breakdown-final-num">{summary.healthScore}</span>
            </div>
          </>
        )}
      </section>

      {/* ── 개선 권장 + 이슈 ── */}
      <section className="pdf-sheet pdf-sheet-tint">
        {priorities.length > 0 && (
          <>
            <PdfSectionHeader icon={Wrench} title="우선 개선 권장 사항" />
            {priorities.map((p) => (
              <div key={p.axis.key} className="pdf-rec-block pdf-avoid-break">
                <h3 className="pdf-h3">{p.axis.label}</h3>
                <p className="text-sm">
                  <strong>문제</strong> — {p.problemSummary}
                </p>
                <p className="text-sm">
                  <strong>권장</strong> — {p.actions.join(" · ")}
                </p>
                <p className="pdf-gain">예상 +{p.expectedGain}점</p>
              </div>
            ))}
          </>
        )}

        {issues.length > 0 && (
          <>
            <PdfSectionHeader icon={AlertTriangle} title="발견된 이슈 상세" spaced />
            {issues.slice(0, 10).map((issue) => (
              <PdfIssueCard key={issue.id} issue={issue} />
            ))}
          </>
        )}
      </section>

      {/* ── 페이지 · SEO · 부록 ── */}
      <section className="pdf-sheet">
        <PdfSectionHeader icon={Globe} title="페이지별 진단" />
        <table className="pdf-table pdf-table-spaced">
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
              const perf = p.lighthouse?.performance;
              const seo = p.lighthouse?.seo;
              return (
                <tr key={p.url}>
                  <td className="pdf-td-url">{p.url}</td>
                  <td>
                    <PdfHttpBadge code={p.statusCode} />
                  </td>
                  <td>
                    <PdfScorePill score={perf} />
                  </td>
                  <td className="tabular-nums">{pageAxeCount(p)}</td>
                  <td>
                    <PdfScorePill score={seo} />
                  </td>
                  <td>
                    <PdfIssuePill count={issueN} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <PdfSectionHeader icon={Search} title="SEO 분석" spaced />
        <ul className="pdf-seo-checklist">
          {seoChecklist.map((item) => (
            <li key={item.id} className="pdf-seo-item pdf-avoid-break">
              <span className={`pdf-seo-status-lg pdf-seo-${item.status}`}>
                {seoStatusLabel(item.status)}
              </span>
              <div className="pdf-seo-item-body">
                <p className="font-semibold">{item.label}</p>
                <p className="text-[10px] text-[#64748b]">{item.note}</p>
                <p className="pdf-seo-why">
                  <strong>왜 중요한가</strong> — {item.whyImportant}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <PdfSectionHeader icon={Layers} title="분석 범위" spaced />
        <dl className="pdf-dl pdf-dl-box">
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
        </dl>
        <p className="pdf-footer-note">
          <ReportIcon icon={Clock} size={12} /> Generated by SCOPURL · {dateShort}
        </p>
      </section>
    </article>
  );
}

function PdfSectionHeader({
  icon: Icon,
  title,
  spaced,
}: {
  icon: typeof FileText;
  title: string;
  spaced?: boolean;
}) {
  return (
    <div className={`pdf-section-header ${spaced ? "pdf-section-header-spaced" : ""}`}>
      <ReportIcon icon={Icon} size={18} className="pdf-section-header-icon" />
      <h2 className="pdf-section-header-title">{title}</h2>
    </div>
  );
}

function PdfIssueCard({ issue }: { issue: ReportIssue }) {
  const category =
    issue.source.includes("접근성") ? "접근성 이슈" : issue.source;
  const CatIcon = issue.source.includes("접근성") ? Accessibility : AlertTriangle;

  return (
    <div className="pdf-issue-card-rich pdf-avoid-break">
      <div className="pdf-issue-card-head">
        <span className="pdf-issue-category">
          <ReportIcon icon={CatIcon} size={14} />
          {category}
        </span>
        <span className={`pdf-severity-pill pdf-severity-${issue.severity}`}>
          {issue.severity.toUpperCase()}
        </span>
      </div>
      <p className="pdf-issue-title">{issue.title}</p>
      <p className="pdf-issue-location">
        <ReportIcon icon={MapPin} size={12} />
        {issue.location}
      </p>
      <div className="pdf-issue-impact-box">
        <p className="pdf-issue-box-label">영향</p>
        <p>{issue.impact}</p>
      </div>
      <div className="pdf-issue-rec-box">
        <p className="pdf-issue-box-label">권장 조치</p>
        <p>{issue.recommendation}</p>
      </div>
    </div>
  );
}

function PdfKpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers;
  label: string;
  value: string;
}) {
  return (
    <div className="pdf-kpi-card">
      <ReportIcon icon={Icon} size={18} className="text-[#00a66a]" />
      <div>
        <p className="pdf-kpi-label">{label}</p>
        <p className="pdf-kpi-value">{value}</p>
      </div>
    </div>
  );
}

function PdfHttpBadge({ code }: { code: number | null | undefined }) {
  if (code == null) return <span className="pdf-pill pdf-pill-muted">—</span>;
  const ok = code >= 200 && code < 400;
  return (
    <span className={`pdf-pill ${ok ? "pdf-pill-ok" : "pdf-pill-warn"}`}>{code}</span>
  );
}

function PdfScorePill({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="pdf-pill pdf-pill-muted">—</span>;
  const tier =
    score >= 80 ? "pdf-pill-ok" : score >= 60 ? "pdf-pill-warn" : "pdf-pill-bad";
  return <span className={`pdf-pill ${tier}`}>{score}</span>;
}

function PdfIssuePill({ count }: { count: number }) {
  if (count === 0) return <span className="pdf-pill pdf-pill-muted">0건</span>;
  return <span className="pdf-pill pdf-pill-warn">{count}건</span>;
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
