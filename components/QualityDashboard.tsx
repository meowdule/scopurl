"use client";

import { AlertOctagon, AlertTriangle } from "lucide-react";
import type { ReportJson } from "@/lib/types";
import {
  buildPriorityImprovements,
  buildQualityProfile,
  buildReportKpi,
  dashboardSummaryText,
} from "@/lib/qualityProfile";
import { ScoreTierBadge, StatusBadge } from "@/components/ReportCharts";
import { RadarChart } from "@/components/RadarChart";
import { PdfDownloadButton } from "@/components/PdfDownloadButton";

type Props = {
  report: ReportJson;
};

export function QualityDashboard({ report }: Props) {
  const { summary, targetUrl, completedAt, crawlMeta, deviceProfile } = report;
  const axes = buildQualityProfile(report);
  const priorities = buildPriorityImprovements(axes);
  const kpi = buildReportKpi(report);
  const profile = deviceProfile || crawlMeta?.deviceProfile;

  return (
    <section className="mt-4 space-y-8">
      <div className="border-b border-card-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-dim">
          scopurl 품질 리포트
        </p>
        <p className="mt-2 break-all text-lg font-semibold text-fg sm:text-xl">
          {targetUrl}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 print:hidden">
          <PdfDownloadButton reportId={report.reportId} targetUrl={targetUrl} />
          {profile && (
            <span className="rounded-full border border-card-border bg-page px-3 py-1 text-xs font-medium text-fg">
              {profile === "mobile"
                ? "모바일 화면 (390px) 분석"
                : "데스크톱 화면 (1440px) 분석"}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="panel flex flex-col justify-center p-6 sm:p-8">
          <div className="flex flex-wrap items-end gap-4">
            <p className="text-6xl font-bold tabular-nums leading-none text-fg sm:text-7xl">
              {summary.healthScore}
            </p>
            <div className="pb-1">
              {summary.statusLabel && (
                <StatusBadge status={summary.statusLabel} />
              )}
            </div>
          </div>
          <p className="mt-4 text-base leading-relaxed text-fg">
            {dashboardSummaryText(summary.statusLabel)}
          </p>
          {completedAt && (
            <p className="mt-2 text-sm text-fg-muted">
              {new Date(completedAt).toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 lg:gap-3">
          <KpiCard label="분석 페이지" value={String(kpi.pageCount)} unit="개" />
          <KpiCard label="발견 링크" value={String(kpi.linkCount)} unit="개" />
          <KpiCard label="발견 이슈" value={String(kpi.issueCount)} unit="건" />
          <KpiCard
            label="분석 시간"
            value={
              kpi.analysisSeconds != null
                ? String(Math.round(kpi.analysisSeconds))
                : "—"
            }
            unit={kpi.analysisSeconds != null ? "초" : ""}
          />
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="text-sm font-semibold text-fg">품질 프로필</h2>
        <p className="mt-1 text-sm text-fg-muted">
          7개 영역의 균형을 한눈에 확인할 수 있습니다.
        </p>
        <div className="mt-6">
          <RadarChart axes={axes} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-fg">영역별 진단</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {axes.map((axis) => (
            <div
              key={axis.key}
              className="rounded-xl border border-card-border bg-card p-4 shadow-cardSm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-fg">{axis.label}</p>
                <ScoreTierBadge tier={axis.tier} label={axis.tierLabel} />
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums text-fg">
                {axis.score}
                <span className="ml-0.5 text-base font-medium text-fg-muted">
                  점
                </span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                {axis.summary}
              </p>
            </div>
          ))}
        </div>
      </div>

      {priorities.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-fg">우선 개선 항목</h2>
          <p className="mt-1 text-sm text-fg-muted">
            점수가 낮은 영역부터 개선하면 효과가 큽니다.
          </p>
          <div className="mt-4 space-y-3">
            {priorities.map((item) => (
              <div
                key={item.axis.key}
                className="rounded-xl border border-card-border bg-page-alt/40 p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {item.urgency === "high" ? (
                    <AlertOctagon
                      className="h-4 w-4 shrink-0 text-red-600"
                      aria-hidden
                    />
                  ) : (
                    <AlertTriangle
                      className="h-4 w-4 shrink-0 text-amber-600"
                      aria-hidden
                    />
                  )}
                  <span className="text-sm font-semibold text-fg">
                    {item.axis.label}
                  </span>
                  <span className="text-sm tabular-nums text-fg-muted">
                    {item.axis.score}점
                  </span>
                  <ScoreTierBadge
                    tier={item.axis.tier}
                    label={item.axis.tierLabel}
                  />
                </div>
                <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-fg">
                  {item.actions.map((action) => (
                    <li key={action} className="flex gap-2">
                      <span className="text-fg-muted">·</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-medium text-accent-dim">
                  예상 개선 효과 +{item.expectedGain}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function KpiCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4 shadow-cardSm">
      <p className="text-xs font-medium text-fg-muted">{label}</p>
      <p className="mt-2 flex items-baseline gap-0.5">
        <span className="text-2xl font-bold tabular-nums text-fg">{value}</span>
        {unit && (
          <span className="text-xs font-medium text-fg-muted">{unit}</span>
        )}
      </p>
    </div>
  );
}
