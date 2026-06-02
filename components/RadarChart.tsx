"use client";

import type { QualityAxis } from "@/lib/qualityProfile";

type Props = {
  axes: QualityAxis[];
  size?: number;
};

export function RadarChart({ axes, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = axes.length;
  const angleStep = (Math.PI * 2) / n;
  const startAngle = -Math.PI / 2;

  const pointAt = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const r = (Math.max(0, Math.min(100, value)) / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const gridLevels = [25, 50, 75, 100];
  const dataPoints = axes.map((a, i) => pointAt(i, a.score));
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:gap-8">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto w-full max-w-[280px] shrink-0"
        role="img"
        aria-label="7축 품질 프로필 레이더 차트"
      >
        {gridLevels.map((level) => {
          const pts = axes
            .map((_, i) => {
              const p = pointAt(i, level);
              return `${p.x},${p.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={level}
              points={pts}
              fill="none"
              stroke="#e8ecf4"
              strokeWidth={1}
            />
          );
        })}

        {axes.map((_, i) => {
          const end = pointAt(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="#e8ecf4"
              strokeWidth={1}
            />
          );
        })}

        <polygon
          points={polygon}
          fill="rgba(0, 196, 113, 0.18)"
          stroke="#00a85f"
          strokeWidth={2}
        />

        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#00a85f" />
        ))}
      </svg>

      <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-2">
        {axes.map((axis) => (
          <div key={axis.key} className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-fg-muted">{axis.label}</span>
            <span className="font-semibold tabular-nums text-fg">{axis.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
