"use client";

import Image from "next/image";
import type { ReportJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";
import { buildQualityProfile, buildReportKpi } from "@/lib/qualityProfile";
import {
  shareCardTagline,
  shareStatusLabelEn,
} from "@/lib/reportCopy";
import { ShareRadarChart } from "@/components/ShareRadarChart";
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "@/lib/shareCardConstants";

export { SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from "@/lib/shareCardConstants";

type Props = {
  report: ReportJson;
  /** true = PNG 캡처용 고정 1200×630 */
  exportMode?: boolean;
};

export function ShareScoreCard({ report, exportMode = false }: Props) {
  const { summary, completedAt } = report;
  const axes = buildQualityProfile(report);
  const kpi = buildReportKpi(report);
  const statusEn = shareStatusLabelEn(summary.statusLabel);

  const generated = completedAt
    ? new Date(completedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "—";

  const analysisSec =
    kpi.analysisSeconds != null ? `${Math.round(kpi.analysisSeconds)}초` : "—";

  return (
    <div
      data-share-card-root
      className={
        exportMode
          ? "relative overflow-hidden bg-white"
          : "relative mx-auto w-full max-w-full overflow-hidden rounded-xl border border-card-border bg-white shadow-cardSm"
      }
      style={
        exportMode
          ? {
              width: SHARE_CARD_WIDTH,
              height: SHARE_CARD_HEIGHT,
              fontFamily:
                '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
            }
          : { aspectRatio: `${SHARE_CARD_WIDTH} / ${SHARE_CARD_HEIGHT}` }
      }
    >
      <div
        className="flex h-full flex-col"
        style={exportMode ? { padding: 40 } : { padding: "clamp(12px, 3vw, 28px)" }}
      >
        <header className="flex items-center gap-2.5">
          <Image
            src={assetUrl("/favicon.png")}
            alt=""
            width={28}
            height={28}
            className="rounded-md"
            unoptimized
          />
          <span
            className="text-sm font-semibold tracking-[0.2em] text-[#00a85f]"
            style={exportMode ? { fontSize: 15 } : undefined}
          >
            SCOPURL
          </span>
        </header>

        <div className="mt-4 flex min-h-0 flex-1 gap-6 lg:gap-10">
          <div className="flex w-[58%] min-w-0 flex-col justify-center">
            <p
              className="font-bold tabular-nums leading-none text-[#0f172a]"
              style={
                exportMode
                  ? { fontSize: 120, letterSpacing: "-0.04em" }
                  : { fontSize: "clamp(3rem, 12vw, 5.5rem)" }
              }
            >
              {summary.healthScore}
            </p>
            <p
              className="mt-3 inline-block w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-bold tracking-widest text-emerald-800"
              style={exportMode ? { fontSize: 14, marginTop: 16 } : undefined}
            >
              {statusEn}
            </p>
            <p
              className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#64748b]"
              style={exportMode ? { fontSize: 13, marginTop: 20 } : undefined}
            >
              Website Health Score
            </p>
            <p
              className="mt-2 max-w-md text-[#334155]"
              style={
                exportMode
                  ? { fontSize: 20, lineHeight: 1.45 }
                  : { fontSize: "clamp(0.8rem, 2.5vw, 1rem)" }
              }
            >
              {shareCardTagline(summary.statusLabel)}
            </p>
          </div>

          <div className="flex w-[42%] items-center justify-center">
            <ShareRadarChart
              axes={axes}
              width={exportMode ? 400 : 280}
              height={exportMode ? 400 : 280}
            />
          </div>
        </div>

        <footer
          className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#e8ecf4] pt-4 text-[#64748b]"
          style={exportMode ? { fontSize: 13, paddingTop: 20 } : { fontSize: 11 }}
        >
          <span>분석 페이지 {kpi.pageCount}개</span>
          <span className="text-[#cbd5e1]">·</span>
          <span>발견 이슈 {kpi.issueCount}건</span>
          <span className="text-[#cbd5e1]">·</span>
          <span>분석 시간 {analysisSec}</span>
          <span className="ml-auto text-[#94a3b8]">Generated {generated}</span>
        </footer>
      </div>
    </div>
  );
}
