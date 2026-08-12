import { Users, TrendingDown, CalendarX, ShieldCheck, ArrowUpRight, ArrowDownRight } from "lucide-react";
import SourceTag from "../components/SourceTag";
import DataTable from "../components/DataTable";
import Sparkline from "../components/charts/Sparkline";
import TrendChart from "../components/charts/TrendChart";
import BarChart from "../components/charts/BarChart";
import ProportionBar from "../components/charts/ProportionBar";
import {
  KPIS,
  FERIAS_PROGRAMADAS,
  AFASTAMENTOS,
  INDICADORES_POR_FILIAL,
  INDICADORES_POR_GESTOR,
  MESES,
  HEADCOUNT_TREND,
  TURNOVER_TREND,
  ABSENTEISMO_TREND,
  COMPOSICAO_FORCA_TRABALHO,
} from "../data/mock/dashboard";

const KPI_ICONS = { Users, TrendingDown, CalendarX, ShieldCheck };

const SPARKLINE_COLOR = {
  neutral: "var(--color-secondary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",
  danger: "var(--color-danger)",
};

const TENDENCIA = MESES.map((label, i) => ({
  label,
  headcount: HEADCOUNT_TREND[i],
  turnover: TURNOVER_TREND[i],
  absenteismo: ABSENTEISMO_TREND[i],
}));

const COMPOSICAO_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
const COMPOSICAO_SEGMENTS = COMPOSICAO_FORCA_TRABALHO.map((c, i) => ({ ...c, color: COMPOSICAO_COLORS[i] }));

const HEADCOUNT_POR_FILIAL = INDICADORES_POR_FILIAL.map((f) => ({ label: f.filial, value: f.headcount }));

function parsePct(str) {
  return parseFloat(String(str).replace(",", "."));
}

function tierBadgeClass(value, good, warn) {
  if (value <= good) return "badge-success";
  if (value <= warn) return "badge-warning";
  return "badge-danger";
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function diasRestantes(iso) {
  const diff = Math.ceil((new Date(iso) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

function Meter({ value, max, color, valueLabel }) {
  return (
    <div className="cell-meter">
      <div className="cell-meter-track">
        <div className="cell-meter-fill" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
      </div>
      <span className="cell-meter-value">{valueLabel ?? value}</span>
    </div>
  );
}

export default function Dashboard() {
  const maxHeadcountFilial = Math.max(...INDICADORES_POR_FILIAL.map((f) => f.headcount));
  const maxHeadcountGestor = Math.max(...INDICADORES_POR_GESTOR.map((g) => g.headcount));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard Executivo</h1>
          <div className="page-subtitle">Visão consolidada de indicadores de RH da Maxpesa</div>
        </div>
        <SourceTag path="SharePoint / RH / Indicadores / Dashboard_Executivo.xlsx" />
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        {KPIS.map((kpi) => {
          const Icon = KPI_ICONS[kpi.icon];
          const TrendIcon = kpi.trend.trim().startsWith("-") ? ArrowDownRight : ArrowUpRight;
          return (
            <div className={`card kpi-card accent-${kpi.variant}`} key={kpi.label}>
              <div className="kpi-card-top">
                <div className="kpi-label">{kpi.label}</div>
                {Icon && (
                  <div className={`kpi-icon kpi-icon-${kpi.variant}`}>
                    <Icon size={18} />
                  </div>
                )}
              </div>
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-card-bottom">
                <div className={`kpi-trend ${kpi.direction}`}>
                  <TrendIcon size={12} />
                  {kpi.trend}
                </div>
                {kpi.history && (
                  <div className="kpi-sparkline">
                    <Sparkline data={kpi.history} color={SPARKLINE_COLOR[kpi.variant]} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 22 }}>
        <div className="card card-pad">
          <div className="section-head">
            <div className="section-title">Evolução do headcount</div>
            <div className="section-hint">últimos 12 meses</div>
          </div>
          <TrendChart
            data={TENDENCIA}
            series={[{ key: "headcount", label: "Headcount", color: "var(--chart-1)", area: true }]}
            valueFormat={(v) => v}
            yTickFormat={(v) => Math.round(v)}
          />
        </div>
        <div className="card card-pad">
          <div className="section-head">
            <div className="section-title">Turnover x Absenteísmo</div>
            <div className="section-hint">últimos 12 meses</div>
          </div>
          <TrendChart
            data={TENDENCIA}
            series={[
              { key: "turnover", label: "Turnover", color: "var(--chart-1)" },
              { key: "absenteismo", label: "Absenteísmo", color: "var(--chart-2)" },
            ]}
            valueFormat={(v) => `${v.toFixed(1).replace(".", ",")}%`}
            yTickFormat={(v) => `${v.toFixed(0)}%`}
          />
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 22 }}>
        <div className="card card-pad">
          <div className="section-title">Headcount por filial</div>
          <BarChart data={HEADCOUNT_POR_FILIAL} color="var(--color-accent)" />
        </div>
        <div className="card card-pad">
          <div className="section-title">Composição da força de trabalho</div>
          <ProportionBar segments={COMPOSICAO_SEGMENTS} />
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 22 }}>
        <div className="card card-pad">
          <div className="section-title">Indicadores por filial</div>
          <DataTable
            columns={[
              { key: "filial", label: "Filial" },
              {
                key: "headcount",
                label: "Headcount",
                render: (row) => <Meter value={row.headcount} max={maxHeadcountFilial} color="var(--color-accent)" />,
              },
              {
                key: "turnover",
                label: "Turnover",
                render: (row) => (
                  <span className={`badge ${tierBadgeClass(parsePct(row.turnover), 2, 3)}`}>{row.turnover}</span>
                ),
              },
              {
                key: "absenteismo",
                label: "Absenteísmo",
                render: (row) => (
                  <span className={`badge ${tierBadgeClass(parsePct(row.absenteismo), 2.5, 3.5)}`}>{row.absenteismo}</span>
                ),
              },
            ]}
            rows={INDICADORES_POR_FILIAL}
            rowKey="filial"
          />
        </div>
        <div className="card card-pad">
          <div className="section-title">Indicadores por gestor</div>
          <DataTable
            columns={[
              { key: "gestor", label: "Gestor" },
              { key: "equipe", label: "Equipe" },
              {
                key: "headcount",
                label: "Headcount",
                render: (row) => <Meter value={row.headcount} max={maxHeadcountGestor} color="var(--color-accent)" />,
              },
              {
                key: "certificacoesValidas",
                label: "Certificações",
                render: (row) => {
                  const v = parsePct(row.certificacoesValidas);
                  const color = v >= 90 ? "var(--color-success)" : v >= 80 ? "var(--color-warning)" : "var(--color-danger)";
                  return <Meter value={v} max={100} color={color} valueLabel={row.certificacoesValidas} />;
                },
              },
            ]}
            rows={INDICADORES_POR_GESTOR}
            rowKey="gestor"
          />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <div className="section-title">Férias programadas</div>
          <DataTable
            columns={[
              { key: "colaborador", label: "Colaborador" },
              { key: "periodo", label: "Período" },
              {
                key: "diasSaldo",
                label: "Saldo (dias)",
                render: (row) => <Meter value={row.diasSaldo} max={30} color="var(--color-info)" />,
              },
            ]}
            rows={FERIAS_PROGRAMADAS}
            rowKey="colaborador"
          />
        </div>
        <div className="card card-pad">
          <div className="section-title">Afastamentos ativos</div>
          <DataTable
            columns={[
              { key: "colaborador", label: "Colaborador" },
              { key: "tipo", label: "Tipo", render: (row) => <span className="badge badge-warning">{row.tipo}</span> },
              {
                key: "periodo",
                label: "Período",
                render: (row) => `${formatDate(row.inicio)} – ${formatDate(row.previsaoRetorno)}`,
              },
              {
                key: "diasRestantes",
                label: "Faltam",
                render: (row) => {
                  const dias = diasRestantes(row.previsaoRetorno);
                  return <span className="badge badge-info">{dias > 0 ? `${dias} dias` : "vencido"}</span>;
                },
              },
            ]}
            rows={AFASTAMENTOS}
            rowKey="colaborador"
          />
        </div>
      </div>
    </div>
  );
}
