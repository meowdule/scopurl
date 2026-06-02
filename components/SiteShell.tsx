"use client";

import { useCallback, useRef, useState } from "react";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { ReportDashboard } from "@/components/ReportDashboard";
import { FloatingLeadButton } from "@/components/FloatingLeadButton";
import type { ReportJson } from "@/lib/types";

export function SiteShell() {
  const [report, setReport] = useState<ReportJson | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
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
    <div className="shell mx-auto max-w-3xl px-5 pb-16 pt-9 sm:px-6">
      <header className="hero pb-8 text-center">
        <p className="hero-eyebrow">scopurl</p>
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          URL 품질 분석
        </h1>
        <p className="lede mx-auto mt-3 max-w-xl text-base leading-relaxed text-fg-muted">
          URL을 입력하면 빠른 연결 점검 후, 실제 브라우저로 페이지를 탐색하고
          성능·접근성·사용성·검색 품질을 한국어 리포트로 보여 드립니다.
        </p>
      </header>

      <main>
        <AnalyzeForm
          onReportReady={onReportReady}
          onAnalyzingChange={setAnalyzing}
        />
      </main>

      {report && !analyzing && (
        <div
          ref={reportRef}
          className="mt-12 border-t border-card-border pt-10"
        >
          <ReportDashboard report={report} onNewAnalysis={onNewAnalysis} />
        </div>
      )}

      <FloatingLeadButton shake={Boolean(report)} />

      <footer className="footer mt-14 border-t border-card-border pt-8 text-center text-xs leading-relaxed text-fg-muted">
        <p className="font-medium text-fg">데이터 보관 안내</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-left sm:text-center">
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
