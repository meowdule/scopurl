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
import {
  buildImprovementSummary,
  priorityShortLine,
} from "@/lib/improvementHint";
import { RadarChart } from "@/components/RadarChart";
import { ScoreTierBadge, SeoStatusBadge } from "@/components/ReportCharts";
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

  const improvementHint = buildImprovementSummary(
    priorities.map((p) => ({
      label: p.axis.label,
      key: p.axis.key,
      expectedGain: p.expectedGain,
    })),
    summary.healthScore,
  );

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

      <section className="pdf-sheet">
        <PdfSectionHeader icon={FileText} title="Executive Summary" />
        <p className="pdf-lead">{pdfExecutiveLine(summary.statusLabel)}</p>

        <div className="pdf-exec-split">
          <div className="pdf-exec-score-panel pdf-avoid-break">
            <p className="pdf-exec-score-num">{summary.healthScore}</p>
            <span className="pdf-exec-badge">{statusEn}</span>
            <p className="pdf-exec-score-caption">Website Health Score</p>
            <p className="pdf-exec-tagline">{shareCardTagline(summary.statusLabel)}</p>
            {improvementHint && (
              <p className="pdf-exec-hint">{improvementHint}</p>
            )}
          </div>
          <div className="pdf-exec-radar-panel pdf-avoid-break">
            <RadarChart axes={axes} size={200} />
          </div>
        </div>

        {priorities.length > 0 && (
          <>
            <h3 className="pdf-h3-accent">우선 개선 TOP3</h3>
            <div className="pdf-priority-row">
              {priorities.map((p, i) => (
                <PdfPriorityCard key={p.axis.key} item={p} rank={i + 1} />
              ))}
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

      <section className="pdf-sheet">
        <PdfSectionHeader icon={Gauge} title="품질 프로필 상세" />
        <div className="pdf-audit-panel">
          {axes.map((axis, i) => (
            <div
              key={axis.key}
              className={`pdf-audit-row pdf-avoid-break ${i < axes.length - 1 ? "pdf-audit-row-border" : ""}`}
            >
              <div className="pdf-audit-left">
                <ReportIcon icon={axisIcon(axis.key)} size={16} className="text-[#64748b]" />
                <span className="font-semibold">{axis.label}</span>
              </div>
              <p className="pdf-audit-desc">{axis.cardDescription}</p>
              <div className="pdf-audit-right">
                <span className="pdf-audit-score">{axis.score}점</span>
                <ScoreTierBadge tier={axis.tier} label={axis.tierLabel} />
              </div>
            </div>
          ))}
        </div>

        {bd && (
          <>
            <PdfSectionHeader icon={FileText} title="점수 산정 근거" spaced />
            <p className="pdf-breakdown-intro">
              <strong>{summary.healthScore}점</strong>은 성능·접근성·사용성·SEO 영역의
              가중치 기반으로 계산되었습니다.
              {bd.penaltyTotal > 0 && ` (감점 −${bd.penaltyTotal}점 포함)`}
            </p>
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

      <section className="pdf-sheet">
        {priorities.length > 0 && (
          <>
            <PdfSectionHeader icon={Wrench} title="우선 개선 권장 사항" />
            {priorities.map((p) => (
              <div key={p.axis.key} className="pdf-rec-block pdf-avoid-break">
                <h3 className="pdf-h3">{p.axis.label}</h3>
                <p className="text-sm text-[#475569]">{p.problemSummary}</p>
                <p className="mt-1 text-sm">{p.actions.join(" · ")}</p>
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
              return (
                <tr key={p.url}>
                  <td className="pdf-td-url">{p.url}</td>
                  <td>
                    <PdfHttpBadge code={p.statusCode} />
                  </td>
                  <td>
                    <PdfScorePill score={p.lighthouse?.performance} />
                  </td>
                  <td className="tabular-nums">{pageAxeCount(p)}</td>
                  <td>
                    <PdfScorePill score={p.lighthouse?.seo} />
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
        <div className="pdf-audit-panel">
          {seoChecklist.map((item, i) => (
            <div
              key={item.id}
              className={`pdf-audit-row pdf-avoid-break ${i < seoChecklist.length - 1 ? "pdf-audit-row-border" : ""}`}
            >
              <div className="pdf-audit-left">
                <ReportIcon icon={Search} size={14} className="text-[#64748b]" />
                <span className="font-semibold text-sm">{item.label}</span>
              </div>
              <p className="pdf-audit-desc text-[10px]">{item.whyImportant}</p>
              <div className="pdf-audit-right">
                <SeoStatusBadge status={item.status} />
              </div>
            </div>
          ))}
        </div>

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

function shareCardTagline(status: "Good" | "Warning" | "Critical" | undefined) {
  if (status === "Good") return "전반적으로 양호한 상태입니다.";
  if (status === "Warning") return "개선하면 좋을 부분이 있습니다.";
  if (status === "Critical") return "우선 조치가 필요한 항목이 있습니다.";
  return "품질 진단 결과입니다.";
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

function PdfPriorityCard({
  item,
  rank,
}: {
  item: ReturnType<typeof buildPriorityImprovements>[number];
  rank: number;
}) {
  return (
    <div className="pdf-priority-card-neutral pdf-avoid-break">
      <div className="pdf-priority-top">
        <span>
          <span className="text-[#64748b]">{rank} </span>
          {item.axis.label}
        </span>
        <span className="pdf-gain-badge">예상 +{item.expectedGain}점</span>
      </div>
      <div className="pdf-priority-mid">
        <span className="pdf-priority-score">{item.axis.score}점</span>
        <span className="text-[10px] text-[#64748b]">개선 우선</span>
      </div>
      <p className="pdf-priority-desc">{priorityShortLine(item.axis.key)}</p>
    </div>
  );
}

function PdfIssueCard({ issue }: { issue: ReportIssue }) {
  return (
    <div className="pdf-issue-card-neutral pdf-avoid-break">
      <div className="pdf-issue-head">
        <p className="pdf-issue-title">{issue.title}</p>
        <span className={`pdf-severity-pill pdf-severity-${issue.severity}`}>
          {issue.severity.toUpperCase()}
        </span>
      </div>
      <div className="pdf-issue-zone">
        <p className="pdf-issue-zone-label">영향</p>
        <p className="pdf-issue-zone-body">{issue.impact}</p>
      </div>
      <div className="pdf-issue-zone">
        <p className="pdf-issue-zone-label">권장 조치</p>
        <p className="pdf-issue-zone-body">{issue.recommendation}</p>
        <p className="pdf-issue-loc">{issue.location}</p>
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
      <ReportIcon icon={Icon} size={18} className="text-[#64748b]" />
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
