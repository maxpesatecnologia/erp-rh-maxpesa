export default function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="card kpi-card" style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <span className="kpi-icon" style={{ width: 44, height: 44 }}>
        <Icon size={20} />
      </span>
      <div>
        <div className="kpi-label" style={{ marginTop: 0 }}>{label}</div>
        <div className="kpi-value" style={{ marginTop: 4 }}>{value}</div>
      </div>
    </div>
  );
}
