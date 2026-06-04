"use client";

import type { PageReport, ReportJson } from "@/lib/types";
import { pageAxeCount } from "@/lib/reportPdfData";
import { REPORT_SECTION } from "@/lib/reportSections";
import { HttpStatusBadge } from "@/components/ReportCharts";
import { ReportIcon, Globe } from "@/lib/reportIcons";

type Props = { report: ReportJson };

function pageIssueCount(p: PageReport): number {
  return (
    pageAxeCount(p) +
    (p.uiIssues?.filter((i) => i.severity !== "info").length ?? 0) +
    (p.consoleErrors?.length ?? 0)
  );
}

function scoreDot(score: number | null | undefined) {
  if (score == null) return null;
  const color =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
        ? "bg-amber-500"
        : "bg-red-500";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} aria-hidden />;
}

export function PagesDiagnosisTable({ report }: Props) {
  const { pages } = report;

  return (
    <section
      id={REPORT_SECTION.pagesTable}
      data-report-section={REPORT_SECTION.pagesTable}
      className="report-section"
    >
      <h2 className="report-section-title flex items-center gap-2">
        <ReportIcon icon={Globe} size={20} className="text-accent-dim" />
        페이지별 진단
      </h2>
      <p className="report-section-desc">분석된 각 페이지의 품질 지표입니다.</p>

      <div className="mt-5 hidden overflow-x-auto rounded-[16px] border border-card-border bg-card md:block">
        <table className="report-table w-full min-w-[640px] border-collapse text-left text-sm">
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
              const issues = pageIssueCount(p);
              return (
                <tr key={p.url} className="group">
                  <td className="max-w-[220px] truncate font-mono text-xs text-fg-muted">
                    {p.url}
                  </td>
                  <td>
                    <HttpStatusBadge code={p.statusCode} />
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      {scoreDot(p.lighthouse?.performance)}
                      {p.lighthouse?.performance ?? "—"}
                    </span>
                  </td>
                  <td className="tabular-nums">{pageAxeCount(p)}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      {scoreDot(p.lighthouse?.seo)}
                      {p.lighthouse?.seo ?? "—"}
                    </span>
                  </td>
                  <td
                    className={
                      issues > 0
                        ? "font-semibold tabular-nums text-amber-800"
                        : "tabular-nums text-fg-muted"
                    }
                  >
                    {issues}건
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="mt-5 space-y-3 md:hidden">
        {pages.map((p) => {
          const issues = pageIssueCount(p);
          return (
            <li
              key={p.url}
              className="rounded-[16px] border border-card-border bg-card p-4"
            >
              <p className="truncate font-mono text-xs text-fg-muted">{p.url}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-fg-muted">상태</dt>
                  <dd className="mt-0.5">
                    <HttpStatusBadge code={p.statusCode} />
                  </dd>
                </div>
                <div>
                  <dt className="text-fg-muted">성능</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {p.lighthouse?.performance ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-fg-muted">접근성</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {pageAxeCount(p)}
                  </dd>
                </div>
                <div>
                  <dt className="text-fg-muted">SEO</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">
                    {p.lighthouse?.seo ?? "—"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-fg-muted">이슈</dt>
                  <dd
                    className={`mt-0.5 font-semibold ${issues > 0 ? "text-amber-800" : "text-fg-muted"}`}
                  >
                    {issues}건
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
