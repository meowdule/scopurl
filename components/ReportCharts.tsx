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
