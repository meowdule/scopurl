"use client";

import type { QualityAxis } from "@/lib/qualityProfile";

type Props = {
  axes: QualityAxis[];
  size?: number;
  showScores?: boolean;
  className?: string;
};

export function RadarChart({
  axes,
  size = 240,
  showScores = false,
  className,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.32;
  const n = axes.length;
  const angleStep = (Math.PI * 2) / n;
  const startAngle = -Math.PI / 2;

  const pointAt = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const r = (Math.max(0, Math.min(100, value)) / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      lx: cx + (maxR + (showScores ? 22 : 16)) * Math.cos(angle),
      ly: cy + (maxR + (showScores ? 22 : 16)) * Math.sin(angle),
    };
  };

  const gridLevels = [25, 50, 75, 100];
  const dataPoints = axes.map((a, i) => pointAt(i, a.score));
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className ?? "mx-auto w-full max-w-[260px]"}
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
        fill="rgba(0, 196, 113, 0.2)"
        stroke="#00a85f"
        strokeWidth={2}
      />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#00a85f" />
      ))}

      {axes.map((axis, i) => {
        const p = pointAt(i, 100);
        return (
          <g key={axis.key}>
            <text
              x={p.lx}
              y={p.ly - (showScores ? 5 : 0)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#64748b"
              fontSize={showScores ? 8 : 9}
            >
              {axis.label}
            </text>
            {showScores && (
              <text
                x={p.lx}
                y={p.ly + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#0f172a"
                fontSize={9}
                fontWeight="600"
              >
                {axis.score}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
