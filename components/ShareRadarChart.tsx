"use client";

const FILL = "rgba(0, 166, 106, 0.22)";
const STROKE = "#00a66a";
const GRID = "#e2e8f0";

type RadarAxis = { label: string; score: number };

type Props = {
  axes: RadarAxis[];
  width?: number;
  height?: number;
};

/** 공유 카드 전용 — 축 라벨만, 점수 숫자 없음, 미니멀 그리드 */
export function ShareRadarChart({
  axes,
  width = 420,
  height = 420,
}: Props) {
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.36;
  const n = axes.length;
  const angleStep = (Math.PI * 2) / n;
  const startAngle = -Math.PI / 2;

  const pointAt = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const r = (Math.max(0, Math.min(100, value)) / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      lx: cx + (maxR + 28) * Math.cos(angle),
      ly: cy + (maxR + 28) * Math.sin(angle),
    };
  };

  const gridLevels = [50, 100];
  const dataPoints = axes.map((a, i) => pointAt(i, a.score));
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-hidden
    >
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={axes
            .map((_, i) => {
              const p = pointAt(i, level);
              return `${p.x},${p.y}`;
            })
            .join(" ")}
          fill="none"
          stroke={GRID}
          strokeWidth={1}
        />
      ))}

      {axes.map((_, i) => {
        const end = pointAt(i, 100);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke={GRID}
            strokeWidth={1}
          />
        );
      })}

      <polygon
        points={polygon}
        fill={FILL}
        stroke={STROKE}
        strokeWidth={2.5}
      />

      {axes.map((axis, i) => {
        const p = pointAt(i, 100);
        return (
          <text
            key={`${axis.label}-${i}`}
            x={p.lx}
            y={p.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#475569"
            fontSize={13}
            fontWeight={500}
            fontFamily='"Pretendard", "Malgun Gothic", system-ui, sans-serif'
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
