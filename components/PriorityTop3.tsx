"use client";

import type { PriorityImprovement } from "@/lib/qualityProfile";
import { priorityShortLine } from "@/lib/improvementHint";
import { ReportIcon, Target } from "@/lib/reportIcons";

type Props = {
  items: PriorityImprovement[];
};

export function PriorityTop3({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="report-section-title flex items-center gap-2">
        <ReportIcon icon={Target} size={20} className="text-fg-muted" />
        우선 개선 TOP3
      </h2>
      <p className="report-section-desc">
        점수 향상 효과가 큰 순서로 정렬했습니다.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {items.map((item, index) => (
          <article
            key={item.axis.key}
            className="flex flex-col rounded-[16px] border border-card-border bg-[#fafbfc] p-5 shadow-cardSm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-fg">
                <span className="mr-1.5 tabular-nums text-fg-muted">
                  {index + 1}
                </span>
                {item.axis.label}
              </span>
              <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-accent-dim">
                예상 +{item.expectedGain}점
              </span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-2">
              <p className="text-4xl font-bold tabular-nums leading-none text-fg">
                {item.axis.score}
                <span className="ml-0.5 text-lg font-semibold text-fg-muted">
                  점
                </span>
              </p>
              <span className="pb-1 text-[11px] font-medium text-fg-muted">
                개선 우선
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-fg-muted">
              {priorityShortLine(item.axis.key)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
