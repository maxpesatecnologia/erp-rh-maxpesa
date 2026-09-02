import { Users, TrendingDown, CalendarX, ShieldCheck, ArrowUpRight, ArrowDownRight } from "lucide-react";
import DataTable from "../components/DataTable";
import Sparkline from "../components/charts/Sparkline";
import TrendChart from "../components/charts/TrendChart";
import BarChart from "../components/charts/BarChart";
import ProportionBar from "../components/charts/ProportionBar";
import { MESES, ABSENTEISMO_TREND, ABSENTEISMO_KPI, FERIAS_PROGRAMADAS, AFASTAMENTOS } from "../data/mock/dashboard";
import { COLABORADORES } from "../data/mock/colaboradores";
import { DESLIGAMENTOS } from "../data/mock/desligamento";
import { TREINAMENTOS } from "../data/mock/treinamentos";

const KPI_ICONS = { Users, TrendingDown, CalendarX, ShieldCheck };

const SPARKLINE_COLOR = {
  neutral: "var(--color-secondary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",
  danger: "var(--color-danger)",
};

const MES_ABREV = { Jan: 1, Fev: 2, Mar: 3, Abr: 4, Mai: 5, Jun: 6, Jul: 7, Ago: 8, Set: 9, Out: 10, Nov: 11, Dez: 12 };

function parseMesLabel(label) {
  const [abrev, aa] = label.split("/");
  return { ano: 2000 + Number(aa), mes: MES_ABREV[abrev] };
}

// mes é 1-indexado; new Date(ano, mes, 0) retorna o último dia do mês "mes".
function fimDoMes(ano, mes) {
  return new Date(ano, mes, 0);
}

// Headcount ao final de um mês: conta quem já tinha sido admitido e ainda não
// tinha sido desligado até aquela data. Colaboradores afastados continuam
// contando no headcount (só não estão "ativos no dia a dia").
function headcountEm(fimMes, predicate = () => true) {
  return COLABORADORES.filter((c) => {
    if (!predicate(c)) return false;
    if (new Date(c.admissao) > fimMes) return false;
    const desligamento = DESLIGAMENTOS.find((d) => d.colaboradorId === c.id);
    return !desligamento || new Date(desligamento.dataDesligamento) > fimMes;
  }).length;
}

// Turnover do mês = desligamentos ocorridos no mês / headcount no início do mês.
function turnoverDoMes(ano, mes, predicate = () => true) {
  const fimMesAtual = fimDoMes(ano, mes);
  const fimMesAnterior = fimDoMes(ano, mes - 1);
  const base = headcountEm(fimMesAnterior, predicate);
  if (base === 0) return 0;
  const saidas = DESLIGAMENTOS.filter((d) => {
    const colaborador = COLABORADORES.find((c) => c.id === d.colaboradorId);
    if (!colaborador || !predicate(colaborador)) return false;
    const data = new Date(d.dataDesligamento);
    return data > fimMesAnterior && data <= fimMesAtual;
  }).length;
  return (saidas / base) * 100;
}

function colaboradorNome(id) {
  return COLABORADORES.find((c) => c.id === id)?.nome ?? "Colaborador não encontrado";
}

function estaDeFerias(colaboradorId, data) {
  return FERIAS_PROGRAMADAS.some(
    (f) => f.colaboradorId === colaboradorId && new Date(f.inicio) <= data && data <= new Date(f.fim),
  );
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function diasRestantes(iso) {
  const diff = Math.ceil((new Date(iso) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

function parsePct(str) {
  return parseFloat(String(str).replace(",", "."));
}

function tierBadgeClass(value, good, warn) {
  if (value <= good) return "badge-success";
  if (value <= warn) return "badge-warning";
  return "badge-danger";
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

// Mês de referência = último mês fechado da série (o mês corrente ainda não
// acabou, então os KPIs "do mês" olham pra trás, como um fechamento mensal real).
const { ano: ANO_REF, mes: MES_REF } = parseMesLabel(MESES[MESES.length - 1]);

const headcountAtivo = headcountEm(fimDoMes(ANO_REF, MES_REF));
const headcountMesAnterior = headcountEm(fimDoMes(ANO_REF, MES_REF - 1));
const deltaHeadcount = headcountAtivo - headcountMesAnterior;

const turnoverMes = turnoverDoMes(ANO_REF, MES_REF);
const turnoverMesAnterior = turnoverDoMes(ANO_REF, MES_REF - 1);
const deltaTurnover = turnoverMes - turnoverMesAnterior;

const HEADCOUNT_TREND = MESES.map((label) => {
  const { ano, mes } = parseMesLabel(label);
  return headcountEm(fimDoMes(ano, mes));
});

const TURNOVER_TREND = MESES.map((label) => {
  const { ano, mes } = parseMesLabel(label);
  return turnoverDoMes(ano, mes);
});

const treinamentosValidos = TREINAMENTOS.filter((t) => t.status !== "Vencido").length;
const treinamentosPendentes = TREINAMENTOS.length - treinamentosValidos;
const pctTreinamentosValidos = Math.round((treinamentosValidos / TREINAMENTOS.length) * 100);

const KPIS = [
  {
    label: "Headcount ativo",
    value: String(headcountAtivo),
    trend: `${deltaHeadcount >= 0 ? "+" : ""}${deltaHeadcount} no mês`,
    direction: deltaHeadcount >= 0 ? "up" : "down",
    icon: "Users",
    variant: "neutral",
    history: HEADCOUNT_TREND.slice(-8),
  },
  {
    label: "Turnover (mês)",
    value: `${turnoverMes.toFixed(1).replace(".", ",")}%`,
    trend: `${deltaTurnover >= 0 ? "+" : ""}${deltaTurnover.toFixed(1).replace(".", ",")} p.p.`,
    direction: deltaTurnover <= 0 ? "up" : "down",
    icon: "TrendingDown",
    variant: deltaTurnover <= 0 ? "success" : "warning",
    history: TURNOVER_TREND.slice(-8),
  },
  ABSENTEISMO_KPI,
  {
    label: "Treinamentos válidos",
    value: `${pctTreinamentosValidos}%`,
    trend: treinamentosPendentes > 0 ? `-${treinamentosPendentes} pendente(s)` : "Tudo em dia",
    direction: treinamentosPendentes > 0 ? "down" : "up",
    icon: "ShieldCheck",
    variant: treinamentosPendentes > 0 ? "warning" : "success",
  },
];

const TENDENCIA = MESES.map((label, i) => ({
  label,
  headcount: HEADCOUNT_TREND[i],
  turnover: TURNOVER_TREND[i],
  absenteismo: ABSENTEISMO_TREND[i],
}));

const hoje = new Date();
const colaboradoresNaoDesligados = COLABORADORES.filter((c) => {
  const desligamento = DESLIGAMENTOS.find((d) => d.colaboradorId === c.id);
  return !desligamento || new Date(desligamento.dataDesligamento) > hoje;
});
const emFeriasHoje = colaboradoresNaoDesligados.filter((c) => estaDeFerias(c.id, hoje)).length;
const afastadosHoje = colaboradoresNaoDesligados.filter((c) => c.status === "Afastado" && !estaDeFerias(c.id, hoje)).length;
const ativosHoje = colaboradoresNaoDesligados.length - emFeriasHoje - afastadosHoje;

const COMPOSICAO_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
const COMPOSICAO_SEGMENTS = [
  { label: "Ativos", value: ativosHoje, color: COMPOSICAO_COLORS[0] },
  { label: "Férias", value: emFeriasHoje, color: COMPOSICAO_COLORS[1] },
  { label: "Afastados", value: afastadosHoje, color: COMPOSICAO_COLORS[2] },
];

const TREINAMENTOS_SEGMENTS = [
  { label: "Válido", value: TREINAMENTOS.filter((t) => t.status === "Válido").length, color: "var(--color-success)" },
  { label: "Vencendo", value: TREINAMENTOS.filter((t) => t.status === "Vencendo").length, color: "var(--color-warning)" },
  { label: "Vencido", value: TREINAMENTOS.filter((t) => t.status === "Vencido").length, color: "var(--color-danger)" },
];

const FILIAIS = [...new Set(COLABORADORES.map((c) => c.filial))];
const GESTORES = [...new Set(COLABORADORES.map((c) => c.gestor))];

const INDICADORES_POR_FILIAL = FILIAIS.map((filial) => ({
  filial,
  headcount: headcountEm(fimDoMes(ANO_REF, MES_REF), (c) => c.filial === filial),
  turnover: `${turnoverDoMes(ANO_REF, MES_REF, (c) => c.filial === filial).toFixed(1).replace(".", ",")}%`,
}));

const INDICADORES_POR_GESTOR = GESTORES.map((gestor) => {
  const colaboradoresGestor = COLABORADORES.filter((c) => c.gestor === gestor);
  const nomes = new Set(colaboradoresGestor.map((c) => c.nome));
  const treinamentosGestor = TREINAMENTOS.filter((t) => nomes.has(t.colaborador));
  const validosGestor = treinamentosGestor.filter((t) => t.status !== "Vencido").length;
  const pct = treinamentosGestor.length === 0 ? 0 : Math.round((validosGestor / treinamentosGestor.length) * 100);
  return {
    gestor,
    equipe: [...new Set(colaboradoresGestor.map((c) => c.equipe))].join(" / "),
    headcount: headcountEm(fimDoMes(ANO_REF, MES_REF), (c) => c.gestor === gestor),
    treinamentosValidos: `${pct}%`,
  };
});

const HEADCOUNT_POR_FILIAL = INDICADORES_POR_FILIAL.map((f) => ({ label: f.filial, value: f.headcount }));

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
            <div className="section-hint">últimos 12 meses · absenteísmo ainda é estimado (sem integração com relógio de ponto)</div>
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
                  <span className={`badge ${tierBadgeClass(parsePct(row.turnover), 10, 25)}`}>{row.turnover}</span>
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
              { key: "equipe", label: "Equipe(s)" },
              {
                key: "headcount",
                label: "Headcount",
                render: (row) => <Meter value={row.headcount} max={maxHeadcountGestor} color="var(--color-accent)" />,
              },
              {
                key: "treinamentosValidos",
                label: "Treinamentos válidos",
                render: (row) => {
                  const v = parsePct(row.treinamentosValidos);
                  const color = v >= 90 ? "var(--color-success)" : v >= 60 ? "var(--color-warning)" : "var(--color-danger)";
                  return <Meter value={v} max={100} color={color} valueLabel={row.treinamentosValidos} />;
                },
              },
            ]}
            rows={INDICADORES_POR_GESTOR}
            rowKey="gestor"
          />
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 22 }}>
        <div className="card card-pad">
          <div className="section-title">Férias programadas</div>
          <DataTable
            columns={[
              { key: "colaborador", label: "Colaborador", render: (row) => colaboradorNome(row.colaboradorId) },
              { key: "periodo", label: "Período", render: (row) => `${formatDate(row.inicio)} a ${formatDate(row.fim)}` },
              {
                key: "diasSaldo",
                label: "Saldo (dias)",
                render: (row) => <Meter value={row.diasSaldo} max={30} color="var(--color-info)" />,
              },
            ]}
            rows={FERIAS_PROGRAMADAS}
            rowKey="colaboradorId"
          />
        </div>
        <div className="card card-pad">
          <div className="section-title">Afastamentos ativos</div>
          <DataTable
            columns={[
              { key: "colaborador", label: "Colaborador", render: (row) => colaboradorNome(row.colaboradorId) },
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
            rowKey="colaboradorId"
          />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <div className="section-title">Treinamentos e certificações</div>
          <ProportionBar segments={TREINAMENTOS_SEGMENTS} />
        </div>
      </div>
    </div>
  );
}
