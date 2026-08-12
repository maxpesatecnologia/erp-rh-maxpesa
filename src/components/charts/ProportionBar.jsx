import { useState } from "react";

export default function ProportionBar({ segments, valueFormat = (v) => v }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const [hoverIndex, setHoverIndex] = useState(null);

  return (
    <div className="proportion-bar-wrap">
      <div className="proportion-bar">
        {segments.map((s, i) => (
          <div
            className={`proportion-segment ${hoverIndex === i ? "is-hover" : ""}`}
            key={s.label}
            style={{ flexGrow: s.value, background: s.color }}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            title={`${s.label}: ${valueFormat(s.value)}`}
          />
        ))}
      </div>
      <div className="proportion-legend">
        {segments.map((s) => (
          <div className="proportion-legend-item" key={s.label}>
            <span className="proportion-legend-dot" style={{ background: s.color }} />
            <span className="proportion-legend-label">{s.label}</span>
            <span className="proportion-legend-value">{valueFormat(s.value)}</span>
            <span className="proportion-legend-pct">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
