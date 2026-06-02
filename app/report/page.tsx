"use client";

import { ReportDashboard } from "@/components/ReportDashboard";
import { FloatingLeadButton } from "@/components/FloatingLeadButton";

/** CSS/레이아웃 확인용 예시 리포트 — 분석 없이 바로 볼 수 있습니다. */
export default function SampleReportPage() {
  return (
    <>
      <ReportDashboard reportId="report-sample" />
      <FloatingLeadButton shake />
    </>
  );
}
