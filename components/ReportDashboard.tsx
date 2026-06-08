"use client";

import { useEffect, useState } from "react";
import type { ReportJson } from "@/lib/types";
import { fetchReport } from "@/lib/pollReport";
import { assetUrl } from "@/lib/paths";
import Link from "next/link";
import { QualityDashboard } from "@/components/QualityDashboard";
import { PriorityTop3 } from "@/components/PriorityTop3";
import { AxisDiagnosisGrid } from "@/components/AxisDiagnosisGrid";
import { ReportIssuesSection } from "@/components/ReportIssuesSection";
import { PagesDiagnosisTable } from "@/components/PagesDiagnosisTable";
import { SeoChecklistSection } from "@/components/SeoChecklistSection";
import { AnalysisScopeSection } from "@/components/AnalysisScopeSection";
import { FloatingExtendedCta } from "@/components/FloatingExtendedCta";
import { ReportPdfDocument } from "@/components/ReportPdfDocument";
import { REPORT_SECTION } from "@/lib/reportSections";
import {
  buildPriorityImprovements,
  buildQualityProfile,
} from "@/lib/qualityProfile";

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

  const axes = buildQualityProfile(report);
  const priorities = buildPriorityImprovements(axes);
  const { targetUrl } = report;

  return (
    <>
      <div className="report-screen mx-auto max-w-[1140px] px-4 pb-32 pt-8 sm:px-6">
        {onNewAnalysis ? (
          <button
            type="button"
            onClick={onNewAnalysis}
            className="mb-6 text-sm font-medium text-accent-dim hover:underline print:hidden"
          >
            ← 새 분석
          </button>
        ) : (
          <Link
            href={assetUrl("/")}
            className="mb-6 inline-block text-sm font-medium text-accent-dim hover:underline print:hidden"
          >
            ← 새 분석
          </Link>
        )}

        <QualityDashboard report={report} />

        <div className="report-flow space-y-10 sm:space-y-12">
          {priorities.length > 0 && (
            <div
              id={REPORT_SECTION.priorityTop3}
              data-report-section={REPORT_SECTION.priorityTop3}
            >
              <PriorityTop3 items={priorities} />
            </div>
          )}

          <AxisDiagnosisGrid report={report} />
          <ReportIssuesSection report={report} />
          <PagesDiagnosisTable report={report} />
          <SeoChecklistSection report={report} />
          <AnalysisScopeSection report={report} />
        </div>
      </div>

      <FloatingExtendedCta defaultSiteUrl={targetUrl} />

      <div className="report-pdf-root hidden print:block">
        <ReportPdfDocument report={report} />
      </div>
    </>
  );
}
