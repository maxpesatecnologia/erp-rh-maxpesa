import { useState } from "react";

export default function BarChart({ data, color = "var(--color-accent)", valueFormat = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const [hoverIndex, setHoverIndex] = useState(null);

  return (
    <div className="hbar-chart">
      {data.map((d, i) => (
        <div
          className={`hbar-row ${hoverIndex === i ? "is-hover" : ""}`}
          key={d.label}
          onMouseEnter={() => setHoverIndex(i)}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <div className="hbar-label">{d.label}</div>
          <div className="hbar-track">
            <div
              className="hbar-fill"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || color }}
            />
          </div>
          <div className="hbar-value">{valueFormat(d.value)}</div>
        </div>
      ))}
    </div>
  );
}
