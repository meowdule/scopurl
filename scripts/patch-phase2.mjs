import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function write(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content.replace(/\r\n/g, "\n"));
  console.log("wrote", rel);
}

write(
  "components/SiteShell.tsx",
  `"use client";

import { useCallback, useRef, useState } from "react";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { ReportDashboard } from "@/components/ReportDashboard";
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
`,
);

write(
  "app/layout.tsx",
  `import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "SnapIt SiteScope — 웹사이트 품질 분석",
  description:
    "URL 한 번으로 성능·접근성·사용성·SEO를 분석하는 SnapIt SiteScope.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={\`\${inter.variable} \${jetbrains.variable}\`}>
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
`,
);

write(
  "app/report/page.tsx",
  `"use client";

import { useEffect } from "react";
import { assetUrl } from "@/lib/paths";

/** v0.1: 상세 리포트는 홈에서만 표시. /report 딥링크는 홈으로 이동 */
export default function ReportRedirectPage() {
  useEffect(() => {
    window.location.replace(assetUrl("/"));
  }, []);

  return (
    <div className="px-4 py-20 text-center text-slate-400">
      리포트 화면으로 이동 중…
    </div>
  );
}
`,
);

// Patch globals.css
const cssPath = path.join(root, "app/globals.css");
let css = fs.readFileSync(cssPath, "utf8");
if (!css.includes("Pretendard")) {
  css = css.replace(
    "body {\n  @apply min-h-screen bg-surface text-slate-100 antialiased;\n}",
    `body {
  @apply min-h-screen bg-surface text-slate-100 antialiased;
  font-family:
    "Pretendard",
    var(--font-geist-sans),
    system-ui,
    -apple-system,
    sans-serif;
}`,
  );
  fs.writeFileSync(cssPath, css);
  console.log("patched globals.css");
}

// Patch AnalyzeForm
const afPath = path.join(root, "components/AnalyzeForm.tsx");
let af = fs.readFileSync(afPath, "utf8").replace(/\r\n/g, "\n");

if (!af.includes("onReportReady")) {
  af = af.replace(
    'import { assetUrl } from "@/lib/paths";',
    'import type { ReportJson } from "@/lib/types";',
  );
  af = af.replace(
    "export function AnalyzeForm() {",
    `type AnalyzeFormProps = {
  onReportReady?: (report: ReportJson) => void;
};

export function AnalyzeForm({ onReportReady }: AnalyzeFormProps) {`,
  );
  af = af.replace(
    `          if (status.phase === "complete") {
            const report = await fetchReport(id);
            if (report) {
              window.location.href = assetUrl(
                \`/report?id=\${encodeURIComponent(id)}\`,
              );
              return;
            }
          }`,
    `          if (status.phase === "complete") {
            const report = await fetchReport(id);
            if (report) {
              setBusy(false);
              setPhase(null);
              setQuick(null);
              setReportId(null);
              onReportReady?.(report);
              return;
            }
          }`,
  );
  af = af.replace(
    "  }, []);",
    "  }, [onReportReady]);",
  );
  af = af.replace(
    `  }, [deviceProfile, pollLoop, runInstantChecks, urlInput]);`,
    `  }, [deviceProfile, onReportReady, pollLoop, runInstantChecks, urlInput]);`,
  );

  af = af.replace(
    `          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Report
              </p>
              <p className="font-mono text-sm text-slate-200">{reportId}</p>
            </div>
            {phaseLabel && (
              <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200">
                {phaseLabel}
              </span>
            )}
          </div>`,
    `          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              분석 진행 상태
            </p>
            {phaseLabel && (
              <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200">
                {phaseLabel}
              </span>
            )}
          </div>`,
  );

  af = af.replace(
    "(busy || reportId)",
    "(busy && (phase || quick))",
  );

  fs.writeFileSync(afPath, af);
  console.log("patched AnalyzeForm.tsx");
}

// Patch ReportDashboard
const rdPath = path.join(root, "components/ReportDashboard.tsx");
let rd = fs.readFileSync(rdPath, "utf8").replace(/\r\n/g, "\n");

if (!rd.includes("onNewAnalysis")) {
  rd = rd.replace(
    "type Props = { reportId: string };",
    `type Props =
  | { report: ReportJson; reportId?: never; onNewAnalysis?: () => void }
  | { reportId: string; report?: never; onNewAnalysis?: () => void };`,
  );

  rd = rd.replace(
    "export function ReportDashboard({ reportId }: Props) {",
    "export function ReportDashboard({ reportId, report: reportProp, onNewAnalysis }: Props) {",
  );

  rd = rd.replace(
    `  useEffect(() => {
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
  }, [reportId]);`,
    `  useEffect(() => {
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
  }, [reportId, reportProp]);`,
  );

  rd = rd.replace(
    `      <Link
        href={assetUrl("/")}
        className="text-sm text-accent hover:underline"
      >
        ← New analysis
      </Link>`,
    `      {onNewAnalysis ? (
        <button
          type="button"
          onClick={onNewAnalysis}
          className="text-sm text-accent hover:underline"
        >
          ← 새 분석
        </button>
      ) : (
        <Link
          href={assetUrl("/")}
          className="text-sm text-accent hover:underline"
        >
          ← 새 분석
        </Link>
      )}`,
  );

  rd = rd.replace(
    `        <p className="text-xs uppercase tracking-widest text-accent">
          SiteScope report
        </p>`,
    `        <p className="text-xs uppercase tracking-widest text-accent">
          SnapIt SiteScope 리포트
        </p>`,
  );

  rd = rd.replace(
    `        <p className="mt-2 font-mono text-xs text-slate-500">{reportId}</p>\n`,
    "",
  );

  fs.writeFileSync(rdPath, rd);
  console.log("patched ReportDashboard.tsx");
}

console.log("Phase 2 patch done");