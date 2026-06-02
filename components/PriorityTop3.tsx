"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { PriorityImprovement } from "@/lib/qualityProfile";

type Props = {
  items: PriorityImprovement[];
};

export function PriorityTop3({ items }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-fg-muted">주요 개선 포인트</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {items.map((item) => {
          const expanded = openKey === item.axis.key;
          return (
            <div
              key={item.axis.key}
              className="rounded-lg border border-card-border bg-card"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenKey(expanded ? null : item.axis.key)
                }
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                aria-expanded={expanded}
              >
                <div>
                  <p className="text-sm font-semibold text-fg">
                    {item.axis.label}
                  </p>
                  <p className="mt-0.5 flex items-baseline gap-2">
                    <span className="text-xl font-bold tabular-nums text-fg">
                      {item.axis.score}
                    </span>
                    <span className="text-xs font-medium text-accent-dim">
                      +{item.expectedGain}
                    </span>
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-fg-muted transition ${expanded ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {expanded && (
                <ul className="border-t border-card-border px-3 pb-3 pt-2 text-xs leading-relaxed text-fg-muted">
                  {item.actions.map((action) => (
                    <li key={action} className="mt-1">
                      · {action}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
