export default function EmptyState({ icon: Icon, title, hint, height = 220 }) {
  return (
    <div className="chart-empty" style={{ minHeight: height }}>
      {Icon && (
        <div className="chart-empty-icon">
          <Icon size={26} strokeWidth={1.6} />
        </div>
      )}
      <div className="chart-empty-title">{title}</div>
      {hint && <div className="chart-empty-hint">{hint}</div>}
    </div>
  );
}
