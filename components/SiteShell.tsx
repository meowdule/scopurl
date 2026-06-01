"use client";

import { useCallback, useRef, useState } from "react";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { ReportDashboard } from "@/components/ReportDashboard";
import { FloatingLeadButton } from "@/components/FloatingLeadButton";
import type { ReportJson } from "@/lib/types";

export function SiteShell() {
  const [report, setReport] = useState<ReportJson | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const onReportReady = useCallback((data: ReportJson) => {
    setReport(data);
    requestAnimationFrame(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const onNewAnalysis = useCallback(() => {
    setReport(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <header className="border-b border-surface-border pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          SnapIt SiteScope
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          웹사이트 품질 분석
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          URL을 입력하면 빠른 연결 점검 후, 실제 브라우저로 페이지를 탐색하고
          성능·접근성·사용성·검색 품질을 한국어 리포트로 보여 드립니다.
        </p>
      </header>

      <main className="mt-10">
        <AnalyzeForm onReportReady={onReportReady} />
      </main>

      {report && (
        <div ref={reportRef} className="mt-12 border-t border-surface-border pt-10">
          <ReportDashboard report={report} onNewAnalysis={onNewAnalysis} />
        </div>
      )}

      {report && <FloatingLeadButton shake />}

      <footer className="mt-16 border-t border-surface-border/60 pt-8 text-xs leading-relaxed text-slate-500">
        <p className="font-medium text-slate-400">데이터 보관 안내</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            분석 결과는 리포트 제공 목적으로만 사용하며, 마케팅·외부 공개에
            활용하지 않습니다.
          </li>
          <li>분석 데이터는 약 30일 후 자동 삭제됩니다.</li>
          <li>
            상세 리포트는 제3자에게 공개되지 않으며, 점수 카드만 선택적으로
            공유할 수 있습니다.
          </li>
        </ul>
      </footer>
    </div>
  );
}
