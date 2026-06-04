"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ReportIcon } from "@/lib/reportIcons";

export type AuditRow = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  trailing: ReactNode;
};

type Props = {
  rows: AuditRow[];
};

/** Stripe/Linear 스타일 — 영역·설명·점수/상태를 한 행에서 비교 */
export function AuditSummaryList({ rows }: Props) {
  return (
    <div className="audit-panel overflow-hidden rounded-[16px] border border-card-border bg-card shadow-cardSm">
      {rows.map((row, i) => (
        <div
          key={row.id}
          className={`audit-row grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-[minmax(7rem,9rem)_1fr_auto] sm:items-center sm:gap-5 sm:px-5 ${
            i < rows.length - 1 ? "border-b border-card-border" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <ReportIcon
              icon={row.icon}
              size={18}
              className="text-fg-muted"
              strokeWidth={2}
            />
            <span className="text-sm font-semibold text-fg">{row.title}</span>
          </div>
          <p className="text-sm leading-relaxed text-fg-muted sm:col-start-2">
            {row.description}
          </p>
          <div className="flex items-center gap-2 sm:justify-end">{row.trailing}</div>
        </div>
      ))}
    </div>
  );
}
