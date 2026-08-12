export default function Sparkline({ data, color = "var(--color-accent)", height = 34, width = 96 }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pad = 3;

  const points = data.map((v, i) => [
    i * stepX,
    pad + (height - pad * 2) * (1 - (v - min) / range),
  ]);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-hidden="true">
      <path d={areaPath} fill={color} opacity="0.12" stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}
