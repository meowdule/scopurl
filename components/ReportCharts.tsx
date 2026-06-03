type DonutProps = {
  value: number | null;
  label: string;
  size?: number;
};

export function DonutChart({ value, label, size = 96 }: DonutProps) {
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  const color =
    v >= 75 ? "#00a85f" : v >= 50 ? "#d97706" : v >= 25 ? "#ea580c" : "#dc2626";
  const track = "#e8ecf4";
  const bg = `conic-gradient(${color} ${v * 3.6}deg, ${track} 0)`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative rounded-full"
        style={{ width: size, height: size, background: bg }}
      >
        <div className="absolute inset-[14%] flex items-center justify-center rounded-full bg-card text-lg font-bold text-fg shadow-inner">
          {value == null ? "—" : v}
        </div>
      </div>
      <p className="text-center text-xs font-medium text-fg-muted">{label}</p>
    </div>
  );
}

export function ProgressBar({
  value,
  label,
}: {
  value: number | null;
  label: string;
}) {
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  const color =
    v >= 75 ? "bg-accent-dim" : v >= 50 ? "bg-amber-500" : "bg-orange-500";

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-fg">{label}</span>
        <span className="tabular-nums text-fg-muted">
          {value == null ? "—" : `${v}점`}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-page">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: "Good" | "Warning" | "Critical";
}) {
  const styles = {
    Good: "border-emerald-300 bg-emerald-50 text-emerald-800",
    Warning: "border-amber-300 bg-amber-50 text-amber-900",
    Critical: "border-red-300 bg-red-50 text-red-800",
  };
  const labels = { Good: "양호", Warning: "주의", Critical: "개선 필요" };
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

const TIER_STYLES = {
  excellent: "border-emerald-300 bg-emerald-50 text-emerald-800",
  good: "border-emerald-200 bg-[#eafbf3] text-emerald-800",
  "needs-work": "border-amber-300 bg-amber-50 text-amber-900",
  critical: "border-red-300 bg-red-50 text-red-800",
} as const;

const TIER_DOT = {
  excellent: "bg-emerald-500",
  good: "bg-emerald-500",
  "needs-work": "bg-amber-500",
  critical: "bg-red-500",
} as const;

export function TierIndicator({
  tier,
}: {
  tier: keyof typeof TIER_DOT;
}) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${TIER_DOT[tier]}`}
      aria-hidden
    />
  );
}

const SEVERITY_STYLES = {
  critical: "border-red-300 bg-red-50 text-red-800",
  high: "border-orange-300 bg-orange-50 text-orange-900",
  medium: "border-amber-300 bg-amber-50 text-amber-900",
  low: "border-slate-300 bg-slate-50 text-slate-700",
} as const;

export function SeverityBadge({
  severity,
}: {
  severity: keyof typeof SEVERITY_STYLES;
}) {
  const labels = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${SEVERITY_STYLES[severity]}`}
    >
      {labels[severity]}
    </span>
  );
}

export function SeoStatusBadge({
  status,
}: {
  status: "pass" | "warn" | "fail" | "unknown";
}) {
  const styles = {
    pass: "border-emerald-300 bg-emerald-50 text-emerald-800",
    warn: "border-amber-300 bg-amber-50 text-amber-900",
    fail: "border-red-300 bg-red-50 text-red-800",
    unknown: "border-slate-300 bg-slate-50 text-slate-600",
  };
  const labels = {
    pass: "충족",
    warn: "개선 권장",
    fail: "누락",
    unknown: "확인 필요",
  };
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function HttpStatusBadge({ code }: { code: number | null | undefined }) {
  if (code == null) {
    return <span className="text-fg-muted">—</span>;
  }
  const ok = code >= 200 && code < 400;
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
        ok
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-amber-300 bg-amber-50 text-amber-900"
      }`}
    >
      {code}
    </span>
  );
}

export function ScoreTierBadge({
  tier,
  label,
}: {
  tier: keyof typeof TIER_STYLES;
  label: string;
}) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TIER_STYLES[tier]}`}
    >
      {label}
    </span>
  );
}
