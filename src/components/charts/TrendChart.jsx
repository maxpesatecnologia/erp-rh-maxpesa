import { useRef, useState } from "react";
import { niceMax } from "./chartUtils";

const W = 640;
const H = 240;
const MARGIN = { top: 14, right: 12, bottom: 26, left: 34 };
const PLOT_W = W - MARGIN.left - MARGIN.right;
const PLOT_H = H - MARGIN.top - MARGIN.bottom;

export default function TrendChart({ data, series, valueFormat = (v) => v, yTickFormat = (v) => v }) {
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const n = data.length;

  const rawMax = Math.max(...series.flatMap((s) => data.map((d) => d[s.key])));
  const yMax = niceMax(rawMax * 1.1);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);

  const xAt = (i) => MARGIN.left + (n === 1 ? 0 : (i / (n - 1)) * PLOT_W);
  const yAt = (v) => MARGIN.top + PLOT_H - (v / yMax) * PLOT_H;

  const linePaths = series.map((s) => {
    const pts = data.map((d, i) => [xAt(i), yAt(d[s.key])]);
    return { key: s.key, d: pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" "), pts };
  });

  const labelStep = n > 8 ? 2 : 1;

  function handleMove(evt) {
    const rect = svgRef.current.getBoundingClientRect();
    const scale = W / rect.width;
    const svgX = (evt.clientX - rect.left) * scale;
    const fraction = (svgX - MARGIN.left) / PLOT_W;
    const idx = Math.round(fraction * (n - 1));
    setHoverIndex(Math.min(n - 1, Math.max(0, idx)));
  }

  const hovered = hoverIndex != null ? data[hoverIndex] : null;
  const tooltipLeftPct = hoverIndex != null ? (xAt(hoverIndex) / W) * 100 : 0;
  const tooltipAlignRight = tooltipLeftPct > 62;

  return (
    <div className="trend-chart">
      {series.length > 1 && (
        <div className="chart-legend">
          {series.map((s) => (
            <div className="chart-legend-item" key={s.key}>
              <span className="chart-legend-line" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}

      <div className="trend-chart-canvas">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="trend-chart-svg"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={MARGIN.left} x2={W - MARGIN.right} y1={yAt(t)} y2={yAt(t)} className="chart-gridline" />
              <text x={MARGIN.left - 8} y={yAt(t)} className="chart-axis-label" textAnchor="end" dominantBaseline="middle">
                {yTickFormat(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) =>
            i % labelStep === 0 || i === n - 1 ? (
              <text key={i} x={xAt(i)} y={H - 6} className="chart-axis-label" textAnchor="middle">
                {d.label}
              </text>
            ) : null
          )}

          {series
            .filter((s) => s.area)
            .map((s) => {
              const pts = data.map((d, i) => [xAt(i), yAt(d[s.key])]);
              const areaD = `${pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")} L${xAt(n - 1).toFixed(1)},${yAt(0)} L${xAt(0).toFixed(1)},${yAt(0)} Z`;
              return <path key={s.key} d={areaD} fill={s.color} opacity="0.1" stroke="none" />;
            })}

          {linePaths.map((lp) => {
            const s = series.find((x) => x.key === lp.key);
            return <path key={lp.key} d={lp.d} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
          })}

          {hoverIndex != null && (
            <>
              <line
                x1={xAt(hoverIndex)}
                x2={xAt(hoverIndex)}
                y1={MARGIN.top}
                y2={H - MARGIN.bottom}
                className="chart-crosshair"
              />
              {series.map((s) => (
                <circle
                  key={s.key}
                  cx={xAt(hoverIndex)}
                  cy={yAt(data[hoverIndex][s.key])}
                  r="4"
                  fill={s.color}
                  stroke="var(--color-surface)"
                  strokeWidth="2"
                />
              ))}
            </>
          )}
        </svg>

        {hovered && (
          <div
            className="chart-tooltip"
            style={{
              left: `${tooltipLeftPct}%`,
              transform: tooltipAlignRight ? "translateX(-100%)" : "none",
            }}
          >
            <div className="chart-tooltip-title">{hovered.label}</div>
            {series.map((s) => (
              <div className="chart-tooltip-row" key={s.key}>
                <span className="chart-tooltip-key" style={{ background: s.color }} />
                <span className="chart-tooltip-label">{s.label}</span>
                <span className="chart-tooltip-value">{valueFormat(hovered[s.key])}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
