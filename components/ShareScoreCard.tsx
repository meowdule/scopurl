"use client";

import Image from "next/image";
import type { ReportJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";
import {
  shareCardDataFromReport,
  shareCardDataFromScoreCard,
  type ShareScoreCardData,
} from "@/lib/shareCardData";
import type { ScoreCardJson } from "@/lib/types";
import { shareCardTagline, shareStatusLabelEn } from "@/lib/reportCopy";
import { ShareRadarChart } from "@/components/ShareRadarChart";
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "@/lib/shareCardConstants";

export { SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from "@/lib/shareCardConstants";

type Props = {
  data: ShareScoreCardData;
  exportMode?: boolean;
};

export function ShareScoreCard({ data, exportMode = false }: Props) {
  const statusEn = shareStatusLabelEn(data.statusLabel);

  const generated = data.completedAt
    ? new Date(data.completedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "—";

  const analysisSec =
    data.analysisSeconds != null
      ? `${Math.round(data.analysisSeconds)}초`
      : "—";

  return (
    <div
      data-share-card-root
      className={
        exportMode
          ? "share-card-root relative overflow-hidden bg-white"
          : "share-card-root relative mx-auto w-full max-w-full overflow-hidden rounded-[22px] border border-[#e2e8f0] bg-white shadow-cardHero"
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
        <header className="flex items-center gap-2">
          <Image
            src={assetUrl("/favicon.png")}
            alt=""
            width={exportMode ? 26 : 24}
            height={exportMode ? 26 : 24}
            className="shrink-0 rounded-md"
            unoptimized
          />
          <span
            className="text-sm font-semibold leading-none tracking-[0.2em] text-[#00a66a]"
            style={exportMode ? { fontSize: 15 } : undefined}
          >
            SCOPURL
          </span>
        </header>

        <div
          className={
            exportMode
              ? "mt-4 flex min-h-0 flex-1 flex-row gap-8"
              : "mt-4 flex min-h-0 flex-1 flex-col gap-4 md:flex-row md:gap-8 lg:gap-10"
          }
        >
          <div
            className={
              exportMode
                ? "flex w-[58%] min-w-0 flex-col justify-center"
                : "flex min-w-0 flex-1 flex-col justify-center md:w-[58%]"
            }
          >
            <p
              className="font-bold tabular-nums leading-none text-[#0f172a]"
              style={
                exportMode
                  ? { fontSize: 120, letterSpacing: "-0.04em" }
                  : { fontSize: "clamp(3rem, 12vw, 5.5rem)" }
              }
            >
              {data.healthScore}
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
              {shareCardTagline(data.statusLabel)}
            </p>
          </div>

          <div
            className={
              exportMode
                ? "flex w-[42%] items-center justify-center"
                : "flex w-full shrink-0 items-center justify-center md:w-[42%]"
            }
          >
            <ShareRadarChart
              axes={data.axes}
              width={exportMode ? 400 : 260}
              height={exportMode ? 400 : 260}
            />
          </div>
        </div>

        <footer
          className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[#e2e8f0] pt-5 text-[#64748b]"
          style={exportMode ? { fontSize: 13, paddingTop: 22, marginTop: 8 } : { fontSize: 11 }}
        >
          <span>분석 페이지 {data.pageCount}개</span>
          <span className="text-[#cbd5e1]">·</span>
          <span>발견 이슈 {data.issueCount}건</span>
          <span className="text-[#cbd5e1]">·</span>
          <span>분석 시간 {analysisSec}</span>
          <span className="ml-auto text-[#94a3b8]">Generated {generated}</span>
        </footer>
      </div>
    </div>
  );
}

export function ShareScoreCardFromReport({
  report,
  exportMode = false,
}: {
  report: ReportJson;
  exportMode?: boolean;
}) {
  return (
    <ShareScoreCard data={shareCardDataFromReport(report)} exportMode={exportMode} />
  );
}

export function ShareScoreCardFromScoreCard({
  card,
  exportMode = false,
}: {
  card: ScoreCardJson;
  exportMode?: boolean;
}) {
  return (
    <ShareScoreCard data={shareCardDataFromScoreCard(card)} exportMode={exportMode} />
  );
}
