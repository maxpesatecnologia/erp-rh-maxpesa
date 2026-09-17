import { useEffect, useMemo, useState } from "react";
import { Users, UserPlus, ArrowRightLeft, ArrowUpRight, ArrowDownRight, Minus, Building2, PieChart, ChevronRight, CalendarCheck, UserMinus, BarChart3, Calendar, AlertTriangle } from "lucide-react";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import TrendChart from "../components/charts/TrendChart";
import DonutChart from "../components/charts/DonutChart";
import ProportionBar from "../components/charts/ProportionBar";
import { COLABORADORES } from "../data/mock/colaboradores";
import { DESLIGAMENTOS } from "../data/mock/desligamento";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { listarColaboradores } from "../lib/colaboradoresApi";
import { listarDesligamentos } from "../lib/desligamentoApi";
import { listarFerias } from "../lib/feriasApi";
import { calcularSaldoFerias, statusGozoFerias, hojeISO } from "../lib/feriasCalculo";
import { formatFilial } from "../utils/format";

const KPI_ICONS = { Users, UserPlus, UserMinus, Building2 };

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MES_ABREV_LIST = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Últimos `qtd` meses terminando em ano/mês (inclusive), com rótulo "Mmm/AA".
function ultimosMeses(qtd, anoRef, mesRef) {
  const lista = [];
  for (let i = qtd - 1; i >= 0; i--) {
    let mes = mesRef - i;
    let ano = anoRef;
    while (mes <= 0) {
      mes += 12;
      ano -= 1;
    }
    lista.push({ ano, mes, label: `${MES_ABREV_LIST[mes - 1]}/${String(ano).slice(-2)}` });
  }
  return lista;
}

// mes é 1-indexado; new Date(ano, mes, 0) retorna o último dia do mês "mes".
function fimDoMes(ano, mes) {
  return new Date(ano, mes, 0);
}

// "YYYY-MM-DD" interpretado como data local, não UTC — new Date("YYYY-MM-DD")
// direto cai em meia-noite UTC e, em fusos negativos (ex.: Brasil), volta pro
// dia/mês anterior ao converter pra hora local. Isso fazia admissões e
// desligamentos no dia 1º caírem no mês errado nos gráficos e KPIs.
function parseDataISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Headcount ao final de um mês: conta quem já tinha sido admitido e ainda não
// tinha sido desligado até aquela data. Colaboradores afastados continuam
// contando no headcount (só não estão "ativos no dia a dia").
function headcountEm(colaboradores, desligamentos, fimMes, predicate = () => true) {
  return colaboradores.filter((c) => {
    if (!predicate(c)) return false;
    if (parseDataISO(c.admissao) > fimMes) return false;
    const desligamento = desligamentos.find((d) => d.colaboradorId === c.id);
    return !desligamento || parseDataISO(desligamento.dataDesligamento) > fimMes;
  }).length;
}

// Turnover do mês = desligamentos ocorridos no mês / headcount no início do mês.
function turnoverDoMes(colaboradores, desligamentos, ano, mes, predicate = () => true) {
  const fimMesAtual = fimDoMes(ano, mes);
  const fimMesAnterior = fimDoMes(ano, mes - 1);
  const base = headcountEm(colaboradores, desligamentos, fimMesAnterior, predicate);
  if (base === 0) return 0;
  const saidas = desligamentos.filter((d) => {
    const colaborador = colaboradores.find((c) => c.id === d.colaboradorId);
    if (!colaborador || !predicate(colaborador)) return false;
    const data = parseDataISO(d.dataDesligamento);
    return data > fimMesAnterior && data <= fimMesAtual;
  }).length;
  return (saidas / base) * 100;
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
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

// Mês de referência dos indicadores "por filial" = mês corrente real.
const HOJE_REF = new Date();
const ANO_REF = HOJE_REF.getFullYear();
const MES_REF = HOJE_REF.getMonth() + 1;

export default function Dashboard() {
  const [colaboradores, setColaboradores] = useState(isSupabaseConfigured ? [] : COLABORADORES);
  const [desligamentos, setDesligamentos] = useState(isSupabaseConfigured ? [] : DESLIGAMENTOS);
  const [ferias, setFerias] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [filtroMes, setFiltroMes] = useState(() => new Date().getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(() => new Date().getFullYear());
  const [filtroTodos, setFiltroTodos] = useState(false);
  const [visualizacaoFerias, setVisualizacaoFerias] = useState("programadas");

  useEffect(() => {
    const feriasPromise = listarFerias()
      .then(setFerias)
      .catch((e) => setErro(e.message || "Erro ao carregar dados de férias."));
    const colaboradoresPromise = isSupabaseConfigured
      ? Promise.all([listarColaboradores(), listarDesligamentos()])
          .then(([colaboradoresRemoto, desligamentosRemoto]) => {
            setColaboradores(colaboradoresRemoto);
            setDesligamentos(desligamentosRemoto);
          })
          .catch((e) => setErro(e.message || "Erro ao carregar dados do dashboard."))
      : Promise.resolve();
    Promise.all([feriasPromise, colaboradoresPromise]).finally(() => setCarregando(false));
  }, []);

  const anosDisponiveis = useMemo(() => {
    const anos = new Set([new Date().getFullYear()]);
    colaboradores.forEach((c) => c.admissao && anos.add(parseDataISO(c.admissao).getFullYear()));
    desligamentos.forEach((d) => d.dataDesligamento && anos.add(parseDataISO(d.dataDesligamento).getFullYear()));
    return [...anos].sort((a, b) => b - a);
  }, [colaboradores, desligamentos]);

  const colaboradoresAtivos = useMemo(
    () => colaboradores.filter((c) => c.status === "Ativo").length,
    [colaboradores],
  );

  const admitidosNoMes = useMemo(
    () =>
      colaboradores.filter((c) => {
        if (!c.admissao) return false;
        if (filtroTodos) return true;
        const data = parseDataISO(c.admissao);
        return data.getFullYear() === filtroAno && data.getMonth() + 1 === filtroMes;
      }).length,
    [colaboradores, filtroMes, filtroAno, filtroTodos],
  );

  const desligadosNoMes = useMemo(
    () =>
      desligamentos.filter((d) => {
        if (!d.dataDesligamento) return false;
        if (filtroTodos) return true;
        const data = parseDataISO(d.dataDesligamento);
        return data.getFullYear() === filtroAno && data.getMonth() + 1 === filtroMes;
      }).length,
    [desligamentos, filtroMes, filtroAno, filtroTodos],
  );

  const totalDepartamentos = useMemo(
    () => new Set(colaboradores.map((c) => c.departamento).filter(Boolean)).size,
    [colaboradores],
  );

  const KPIS = [
    {
      label: "Colaboradores Ativos",
      value: String(colaboradoresAtivos),
      trend: "cadastrados no sistema",
      direction: "neutral",
      icon: "Users",
    },
    {
      label: filtroTodos ? "Admitidos (Total)" : "Admitidos no Mês",
      value: String(admitidosNoMes),
      trend: filtroTodos ? "todo o período" : `${NOMES_MESES[filtroMes - 1]}/${filtroAno}`,
      direction: admitidosNoMes > 0 ? "up" : "neutral",
      icon: "UserPlus",
    },
    {
      label: filtroTodos ? "Desligados (Total)" : "Desligados no Mês",
      value: String(desligadosNoMes),
      trend: filtroTodos ? "todo o período" : `${NOMES_MESES[filtroMes - 1]}/${filtroAno}`,
      direction: desligadosNoMes > 0 ? "down" : "neutral",
      icon: "UserMinus",
    },
    {
      label: "Departamentos",
      value: String(totalDepartamentos),
      trend: "áreas com colaboradores",
      direction: "neutral",
      icon: "Building2",
    },
  ];

  const JANELA_TENDENCIA = useMemo(() => ultimosMeses(6, ANO_REF, MES_REF), []);

  const HEADCOUNT_TREND = useMemo(
    () =>
      JANELA_TENDENCIA.map(({ ano, mes }) => headcountEm(colaboradores, desligamentos, fimDoMes(ano, mes))),
    [colaboradores, desligamentos, JANELA_TENDENCIA],
  );

  const ADMISSOES_TREND = useMemo(
    () =>
      JANELA_TENDENCIA.map(({ ano, mes }) =>
        colaboradores.filter((c) => {
          if (!c.admissao) return false;
          const data = parseDataISO(c.admissao);
          return data.getFullYear() === ano && data.getMonth() + 1 === mes;
        }).length,
      ),
    [colaboradores, JANELA_TENDENCIA],
  );

  const DESLIGAMENTOS_TREND = useMemo(
    () =>
      JANELA_TENDENCIA.map(({ ano, mes }) =>
        desligamentos.filter((d) => {
          if (!d.dataDesligamento) return false;
          const data = parseDataISO(d.dataDesligamento);
          return data.getFullYear() === ano && data.getMonth() + 1 === mes;
        }).length,
      ),
    [desligamentos, JANELA_TENDENCIA],
  );

  const TENDENCIA = JANELA_TENDENCIA.map(({ label }, i) => ({
    label,
    headcount: HEADCOUNT_TREND[i],
    admissoes: ADMISSOES_TREND[i],
    desligamentos: DESLIGAMENTOS_TREND[i],
  }));

  const colaboradorNome = (id) => colaboradores.find((c) => c.id === id)?.nome ?? "Colaborador não encontrado";

  const feriasAprovadas = ferias.filter((f) => f.status === "Aprovada");
  const hojeStr = hojeISO();
  const estaDeFeriasHoje = (colaboradorId) =>
    feriasAprovadas.some((f) => f.colaboradorId === colaboradorId && f.dataInicio <= hojeStr && hojeStr <= f.dataFim);

  // Fonte da verdade para "quem está na empresa hoje": o campo status, que é
  // atualizado no momento do desligamento (ver handleConfirmarDesligamento em
  // CadastroColaboradores.jsx). Evita contar demitidos nos indicadores atuais
  // por depender de datas de desligamento cruzadas com outra tabela.
  const colaboradoresNaoDesligados = colaboradores.filter((c) => c.status !== "Desligado");
  const emFeriasHoje = colaboradoresNaoDesligados.filter((c) => estaDeFeriasHoje(c.id)).length;
  const AFASTADOS_ATIVOS = colaboradoresNaoDesligados.filter((c) => c.status === "Afastado" && !estaDeFeriasHoje(c.id));
  const afastadosHoje = AFASTADOS_ATIVOS.length;
  const ativosHoje = colaboradoresNaoDesligados.length - emFeriasHoje - afastadosHoje;

  const FERIAS_PROGRAMADAS = feriasAprovadas
    .map((f) => ({ ...f, statusGozo: statusGozoFerias(f.dataInicio, f.dataFim, hojeStr) }))
    .filter((f) => f.statusGozo !== "Concluída")
    .map((f) => ({
      id: f.id,
      colaboradorId: f.colaboradorId,
      inicio: f.dataInicio,
      fim: f.dataFim,
      diasSaldo: calcularSaldoFerias(colaboradores.find((c) => c.id === f.colaboradorId), ferias, hojeStr).diasDisponiveis,
    }));

  const FERIAS_ATRASADAS = colaboradoresNaoDesligados
    .filter((c) => c.status === "Ativo")
    .map((c) => ({ id: c.id, colaborador: c, saldo: calcularSaldoFerias(c, ferias, hojeStr) }))
    .filter((s) => s.saldo.vencidas)
    .sort((a, b) => b.saldo.diasEmAtraso - a.saldo.diasEmAtraso);

  const COMPOSICAO_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
  const COMPOSICAO_SEGMENTS = [
    { label: "Ativos", value: ativosHoje, color: COMPOSICAO_COLORS[0] },
    { label: "Férias", value: emFeriasHoje, color: COMPOSICAO_COLORS[1] },
    { label: "Afastados", value: afastadosHoje, color: COMPOSICAO_COLORS[2] },
  ];

  const FILIAIS = [...new Set(colaboradoresNaoDesligados.map((c) => c.filial).filter(Boolean))];

  const INDICADORES_POR_FILIAL = FILIAIS.map((filial) => ({
    filial,
    headcount: colaboradoresNaoDesligados.filter((c) => c.filial === filial).length,
    turnover: `${turnoverDoMes(colaboradores, desligamentos, ANO_REF, MES_REF, (c) => c.filial === filial).toFixed(1).replace(".", ",")}%`,
  }));

  const HEADCOUNT_POR_FILIAL = INDICADORES_POR_FILIAL.map((f) => ({ label: formatFilial(f.filial), value: f.headcount }));

  const FILIAL_CHART_COLORS = [
    "var(--color-accent)",
    "var(--color-text)",
    "var(--color-text-muted)",
  ];
  const HEADCOUNT_POR_FILIAL_ORDENADO = [...HEADCOUNT_POR_FILIAL].sort((a, b) => b.value - a.value);
  const HEADCOUNT_POR_FILIAL_SEGMENTS = HEADCOUNT_POR_FILIAL_ORDENADO.slice(0, FILIAL_CHART_COLORS.length).map((f, i) => ({
    label: f.label,
    value: f.value,
    color: FILIAL_CHART_COLORS[i],
  }));
  const FILIAIS_RESTANTES = HEADCOUNT_POR_FILIAL_ORDENADO.slice(FILIAL_CHART_COLORS.length);
  if (FILIAIS_RESTANTES.length > 0) {
    HEADCOUNT_POR_FILIAL_SEGMENTS.push({
      label: "Outras",
      value: FILIAIS_RESTANTES.reduce((sum, f) => sum + f.value, 0),
      color: "var(--color-border-strong)",
    });
  }

  const DEPARTAMENTOS = [...new Set(colaboradoresNaoDesligados.map((c) => c.departamento).filter(Boolean))];
  const ATIVOS_POR_DEPARTAMENTO = DEPARTAMENTOS.map((departamento) => ({
    departamento,
    ativos: colaboradoresNaoDesligados.filter((c) => c.departamento === departamento && c.status === "Ativo").length,
  })).sort((a, b) => b.ativos - a.ativos);
  const maxAtivosDepartamento = ATIVOS_POR_DEPARTAMENTO.length
    ? Math.max(...ATIVOS_POR_DEPARTAMENTO.map((d) => d.ativos))
    : 1;

  const hasColaboradores = colaboradores.length > 0;
  const hasComposicao = COMPOSICAO_SEGMENTS.some((s) => s.value > 0);

  const maxHeadcountFilial = INDICADORES_POR_FILIAL.length ? Math.max(...INDICADORES_POR_FILIAL.map((f) => f.headcount)) : 1;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard Executivo</h1>
          <div className="page-subtitle">Visão consolidada de indicadores de RH da Maxpesa</div>
        </div>
        <div className="periodo-filtro">
          <Calendar size={15} strokeWidth={1.8} className="periodo-filtro-icon" />
          <select
            value={filtroMes}
            onChange={(e) => {
              setFiltroMes(Number(e.target.value));
              setFiltroTodos(false);
            }}
            disabled={filtroTodos}
            aria-label="Filtrar por mês"
          >
            {NOMES_MESES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <span className="periodo-filtro-divider" />
          <select
            value={filtroAno}
            onChange={(e) => {
              setFiltroAno(Number(e.target.value));
              setFiltroTodos(false);
            }}
            disabled={filtroTodos}
            aria-label="Filtrar por ano"
          >
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
          <span className="periodo-filtro-divider" />
          <button
            type="button"
            className={`periodo-filtro-todos${filtroTodos ? " active" : ""}`}
            onClick={() => setFiltroTodos((v) => !v)}
            aria-pressed={filtroTodos}
          >
            Todos
          </button>
          {(filtroTodos || filtroMes !== MES_REF || filtroAno !== ANO_REF) && (
            <button
              type="button"
              className="btn btn-outline btn-limpar"
              onClick={() => {
                setFiltroMes(MES_REF);
                setFiltroAno(ANO_REF);
                setFiltroTodos(false);
              }}
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

      {carregando ? (
        <div className="section-hint">Carregando dashboard…</div>
      ) : (
        <>
        <div className="grid grid-4" style={{ marginBottom: 22 }}>
          {KPIS.map((kpi) => {
            const Icon = KPI_ICONS[kpi.icon];
            const TrendIcon = kpi.direction === "neutral" ? Minus : kpi.direction === "down" ? ArrowDownRight : ArrowUpRight;
            return (
              <div className="card kpi-card" key={kpi.label}>
                <div className="kpi-card-top">
                  <div className="kpi-card-heading">
                    {Icon && (
                      <span className="kpi-card-heading-icon">
                        <Icon size={13} strokeWidth={2} />
                      </span>
                    )}
                    <span>{kpi.label}</span>
                  </div>
                  <ChevronRight size={16} className="kpi-chevron" />
                </div>
                <div className="kpi-value">{kpi.value}</div>
                <div className="kpi-card-bottom">
                  <div className={`kpi-trend ${kpi.direction}`}>
                    <TrendIcon size={13} />
                    {kpi.trend}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
  
        <div className="grid grid-2" style={{ marginBottom: 22 }}>
          <div className="card card-pad">
            <div className="section-head">
              <div className="section-title">
                <span className="section-icon"><Users size={15} strokeWidth={1.8} /></span>
                Evolução do headcount
              </div>
              <div className="section-hint"><Calendar size={12} strokeWidth={1.8} /> últimos 6 meses</div>
            </div>
            {hasColaboradores ? (
              <TrendChart
                data={TENDENCIA}
                series={[{ key: "headcount", label: "Headcount", color: "var(--chart-1)", area: true }]}
                valueFormat={(v) => v}
                yTickFormat={(v) => Math.round(v)}
              />
            ) : (
              <EmptyState
                icon={Users}
                title="Ainda sem colaboradores cadastrados"
                hint="A evolução do headcount aparece aqui assim que a base de colaboradores for importada."
              />
            )}
          </div>
          <div className="card card-pad">
            <div className="section-head">
              <div className="section-title">
                <span className="section-icon"><ArrowRightLeft size={15} strokeWidth={1.8} /></span>
                Admissões x Desligamentos
              </div>
              <div className="section-hint"><Calendar size={12} strokeWidth={1.8} /> últimos 6 meses</div>
            </div>
            {hasColaboradores ? (
              <TrendChart
                data={TENDENCIA}
                series={[
                  { key: "admissoes", label: "Admissões", color: "var(--color-success)" },
                  { key: "desligamentos", label: "Desligamentos", color: "var(--color-danger)" },
                ]}
                valueFormat={(v) => v}
                yTickFormat={(v) => Math.round(v)}
              />
            ) : (
              <EmptyState
                icon={ArrowRightLeft}
                title="Sem histórico de movimentação"
                hint="Admissões e desligamentos são calculados a partir da base de colaboradores."
              />
            )}
          </div>
        </div>
  
        <div className="grid grid-2" style={{ marginBottom: 22 }}>
          <div className="card card-pad">
            <div className="section-head">
              <div className="section-title">
                <span className="section-icon"><Building2 size={15} strokeWidth={1.8} /></span>
                Headcount por filial
              </div>
              <ChevronRight size={16} className="section-chevron" />
            </div>
            {hasColaboradores ? (
              <DonutChart segments={HEADCOUNT_POR_FILIAL_SEGMENTS} centerLabel="colaboradores" />
            ) : (
              <EmptyState icon={Building2} title="Nenhuma filial com colaboradores" height={160} />
            )}
          </div>
          <div className="card card-pad">
            <div className="section-head">
              <div className="section-title">
                <span className="section-icon"><PieChart size={15} strokeWidth={1.8} /></span>
                Composição da força de trabalho
              </div>
              <ChevronRight size={16} className="section-chevron" />
            </div>
            {hasComposicao ? (
              <ProportionBar segments={COMPOSICAO_SEGMENTS} />
            ) : (
              <EmptyState icon={PieChart} title="Sem colaboradores ativos para compor o quadro" height={160} />
            )}
          </div>
        </div>
  
        <div className="grid grid-2" style={{ marginBottom: 22 }}>
          <div className="card card-pad">
            <div className="section-head">
              <div className="section-title">
                <span className="section-icon"><BarChart3 size={15} strokeWidth={1.8} /></span>
                Indicadores por filial
              </div>
              <ChevronRight size={16} className="section-chevron" />
            </div>
            <DataTable
              columns={[
                { key: "filial", label: "Filial", render: (row) => formatFilial(row.filial) },
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
            <div className="section-head">
              <div className="section-title">
                <span className="section-icon"><Building2 size={15} strokeWidth={1.8} /></span>
                Ativos por departamento
              </div>
              <ChevronRight size={16} className="section-chevron" />
            </div>
            {ATIVOS_POR_DEPARTAMENTO.length > 0 ? (
              <DataTable
                columns={[
                  { key: "departamento", label: "Departamento" },
                  {
                    key: "ativos",
                    label: "Ativos",
                    render: (row) => <Meter value={row.ativos} max={maxAtivosDepartamento} color="var(--color-accent)" />,
                  },
                ]}
                rows={ATIVOS_POR_DEPARTAMENTO}
                rowKey="departamento"
              />
            ) : (
              <EmptyState icon={Building2} title="Nenhum departamento com colaboradores ativos" height={160} />
            )}
          </div>
        </div>
  
        <div className="grid grid-2" style={{ marginBottom: 22 }}>
          <div className="card card-pad">
            <div className="section-head">
              <div className="section-title">
                <span className="section-icon"><CalendarCheck size={15} strokeWidth={1.8} /></span>
                Férias
              </div>
              <ChevronRight size={16} className="section-chevron" />
            </div>
            <div className="view-switch" style={{ marginBottom: 14 }}>
              <button
                type="button"
                className={"view-switch-btn" + (visualizacaoFerias === "programadas" ? " active" : "")}
                onClick={() => setVisualizacaoFerias("programadas")}
              >
                Programadas <span style={{ opacity: 0.7 }}>({FERIAS_PROGRAMADAS.length})</span>
              </button>
              <button
                type="button"
                className={"view-switch-btn" + (visualizacaoFerias === "atrasadas" ? " active" : "")}
                onClick={() => setVisualizacaoFerias("atrasadas")}
              >
                Atrasadas <span style={{ opacity: 0.7 }}>({FERIAS_ATRASADAS.length})</span>
              </button>
            </div>
            {visualizacaoFerias === "programadas" ? (
              FERIAS_PROGRAMADAS.length > 0 ? (
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
                  rowKey="id"
                />
              ) : (
                <EmptyState icon={CalendarCheck} title="Nenhuma férias agendada ou em andamento" height={160} />
              )
            ) : FERIAS_ATRASADAS.length > 0 ? (
              <DataTable
                columns={[
                  { key: "colaborador", label: "Colaborador", render: (row) => row.colaborador.nome },
                  { key: "diasEmAtraso", label: "Há quantos dias", render: (row) => `${row.saldo.diasEmAtraso} dias` },
                  { key: "diasDisponiveis", label: "Dias não gozados", render: (row) => <strong>{row.saldo.diasDisponiveis}</strong> },
                  { key: "alerta", label: "", render: () => <span className="badge badge-danger">Vencidas</span> },
                ]}
                rows={FERIAS_ATRASADAS}
                rowKey="id"
              />
            ) : (
              <EmptyState icon={AlertTriangle} title="Nenhuma férias atrasada" height={160} />
            )}
          </div>
          <div className="card card-pad">
            <div className="section-head">
              <div className="section-title">
                <span className="section-icon"><UserMinus size={15} strokeWidth={1.8} /></span>
                Afastamentos ativos
              </div>
              <ChevronRight size={16} className="section-chevron" />
            </div>
            {AFASTADOS_ATIVOS.length > 0 ? (
              <DataTable
                columns={[
                  { key: "colaborador", label: "Colaborador", render: (row) => row.nome },
                  { key: "cargo", label: "Cargo" },
                  { key: "departamento", label: "Departamento" },
                  { key: "filial", label: "Filial", render: (row) => formatFilial(row.filial) },
                  { key: "status", label: "Status", render: () => <span className="badge badge-warning">Afastado</span> },
                ]}
                rows={AFASTADOS_ATIVOS}
                rowKey="id"
              />
            ) : (
              <EmptyState icon={UserMinus} title="Nenhum colaborador afastado no momento" height={160} />
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
