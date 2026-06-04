"use client";

import type { PriorityImprovement } from "@/lib/qualityProfile";
import { ReportIcon, Target, axisIcon } from "@/lib/reportIcons";

type Props = {
  items: PriorityImprovement[];
};

export function PriorityTop3({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="report-section-title flex items-center gap-2">
        <ReportIcon icon={Target} size={20} className="text-accent-dim" />
        우선 개선 TOP3
      </h2>
      <p className="report-section-desc">
        점수 향상 효과가 큰 순서로 정렬했습니다.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {items.map((item, index) => (
          <article
            key={item.axis.key}
            className="flex min-h-[200px] flex-col rounded-[16px] border border-card-border bg-card p-5 shadow-cardSm"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eafbf3] text-xs font-bold text-accent-dim">
              {index + 1}
            </span>
            <h3 className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-fg">
              <ReportIcon icon={axisIcon(item.axis.key)} size={16} className="text-accent-dim" />
              {item.axis.label}
            </h3>
            <p className="mt-1 text-3xl font-bold tabular-nums text-fg">
              {item.axis.score}
              <span className="text-base font-medium text-fg-muted">점</span>
            </p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-fg-muted">
              {item.problemSummary}
            </p>
            <p className="mt-4 text-sm font-semibold text-accent-dim">
              예상 효과 +{item.expectedGain}점
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
