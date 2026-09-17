import { useState } from "react";

const SIZE = 176;
const STROKE = 24;
const HOVER_STROKE = STROKE + 4;
const EDGE_PADDING = 3;
const RADIUS = (SIZE - HOVER_STROKE) / 2 - EDGE_PADDING;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 4;

export default function DonutChart({ segments, valueFormat = (v) => v, centerLabel }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const [hoverIndex, setHoverIndex] = useState(null);

  let offset = 0;
  const arcs = segments.map((s) => {
    const length = (s.value / total) * CIRCUMFERENCE;
    const dash = Math.max(length - GAP, 0);
    const dashoffset = -offset;
    offset += length;
    return { ...s, dasharray: `${dash} ${CIRCUMFERENCE - dash}`, dashoffset };
  });

  return (
    <div className="donut-chart-wrap">
      <div className="donut-chart" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-subtle)"
            strokeWidth={STROKE}
          />
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {arcs.map((a, i) => {
              const hovered = hoverIndex === i;
              const dimmed = hoverIndex !== null && !hovered;
              return (
                <circle
                  key={a.label}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={a.color}
                  strokeDasharray={a.dasharray}
                  strokeDashoffset={a.dashoffset}
                  className="donut-arc"
                  style={{ strokeWidth: hovered ? HOVER_STROKE : STROKE, opacity: dimmed ? 0.35 : 1 }}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <title>{`${a.label}: ${valueFormat(a.value)}`}</title>
                </circle>
              );
            })}
          </g>
        </svg>
        <div className="donut-center">
          <div className="donut-center-value">{valueFormat(total)}</div>
          {centerLabel && <div className="donut-center-label">{centerLabel}</div>}
        </div>
      </div>
      <div className="donut-legend">
        {segments.map((s, i) => {
          const hovered = hoverIndex === i;
          const dimmed = hoverIndex !== null && !hovered;
          return (
            <div
              className={`donut-legend-item ${hovered ? "is-hover" : ""} ${dimmed ? "is-dim" : ""}`}
              key={s.label}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <span className="donut-legend-dot" style={{ background: s.color }} />
              <span className="donut-legend-label">{s.label}</span>
              <span className="donut-legend-value">{valueFormat(s.value)}</span>
              <span className="donut-legend-pct">{Math.round((s.value / total) * 100)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
