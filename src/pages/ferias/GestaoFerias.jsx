import { useEffect, useMemo, useState } from "react";
import { Plus, Check, X as XIcon, CalendarPlus, Undo2, ListChecks, Wallet, SlidersHorizontal, AlertTriangle } from "lucide-react";
import Avatar from "../../components/Avatar";
import DataTable from "../../components/DataTable";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import UltimaEdicaoBadge from "../../components/UltimaEdicaoBadge";
import SolicitarFeriasModal from "./SolicitarFeriasModal";
import RecusarFeriasModal from "./RecusarFeriasModal";
import ProrrogarFeriasModal from "./ProrrogarFeriasModal";
import AjustarSaldoFeriasModal from "./AjustarSaldoFeriasModal";
import { useAuth } from "../../context/AuthContext";
import { COLABORADORES } from "../../data/mock/colaboradores";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { listarColaboradores, atualizarAjusteFeriasColaborador } from "../../lib/colaboradoresApi";
import {
  listarFerias,
  criarSolicitacaoFerias,
  aprovarFerias,
  recusarFerias,
  cancelarFerias,
  prorrogarFerias,
} from "../../lib/feriasApi";
import { calcularSaldoFerias, statusGozoFerias } from "../../lib/feriasCalculo";
import { formatDate, formatMoeda } from "../../utils/format";

const STATUS_BADGE = {
  Pendente: "badge-warning",
  Aprovada: "badge-success",
  Recusada: "badge-danger",
  Cancelada: "badge-neutral",
};

const GOZO_BADGE = {
  Agendada: "badge-warning",
  "Em andamento": "badge-info",
  Concluída: "badge-neutral",
};

export default function GestaoFerias() {
  const { user } = useAuth();
  const [colaboradores, setColaboradores] = useState(isSupabaseConfigured ? [] : COLABORADORES);
  const [ferias, setFerias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [visualizacao, setVisualizacao] = useState("solicitacoes");

  const [solicitarAberto, setSolicitarAberto] = useState(false);
  const [salvandoSolicitacao, setSalvandoSolicitacao] = useState(false);
  const [erroSolicitacao, setErroSolicitacao] = useState("");

  const [feriasRecusando, setFeriasRecusando] = useState(null);
  const [salvandoRecusa, setSalvandoRecusa] = useState(false);
  const [erroRecusa, setErroRecusa] = useState("");

  const [feriasProrrogando, setFeriasProrrogando] = useState(null);
  const [salvandoProrrogacao, setSalvandoProrrogacao] = useState(false);
  const [erroProrrogacao, setErroProrrogacao] = useState("");

  const [feriasCancelando, setFeriasCancelando] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState("");

  const [colaboradorAjustando, setColaboradorAjustando] = useState(null);
  const [salvandoAjuste, setSalvandoAjuste] = useState(false);
  const [erroAjuste, setErroAjuste] = useState("");

  useEffect(() => {
    const carregarColaboradores = isSupabaseConfigured
      ? listarColaboradores()
          .then(setColaboradores)
          .catch((e) => setErro(e.message || "Erro ao carregar colaboradores."))
      : Promise.resolve();
    const carregarFerias = listarFerias()
      .then(setFerias)
      .catch((e) => setErro(e.message || "Erro ao carregar solicitações de férias."));
    Promise.all([carregarColaboradores, carregarFerias]).finally(() => setCarregando(false));
  }, []);

  const colaboradoresAtivos = colaboradores.filter((c) => c.status === "Ativo");

  const feriasComColaborador = ferias.map((f) => ({ ...f, colaborador: colaboradores.find((c) => c.id === f.colaboradorId) }));
  const pendentes = feriasComColaborador.filter((f) => f.status === "Pendente");
  const aprovadas = feriasComColaborador
    .filter((f) => f.status === "Aprovada")
    .map((f) => ({ ...f, statusGozo: statusGozoFerias(f.dataInicio, f.dataFim) }));
  const historico = feriasComColaborador.filter((f) => f.status === "Recusada" || f.status === "Cancelada");

  const saldos = useMemo(
    () => colaboradoresAtivos.map((c) => ({ id: c.id, colaborador: c, saldo: calcularSaldoFerias(c, ferias) })),
    [colaboradoresAtivos, ferias]
  );

  const atrasadas = useMemo(
    () => saldos.filter((s) => s.saldo.vencidas).sort((a, b) => b.saldo.diasEmAtraso - a.saldo.diasEmAtraso),
    [saldos]
  );

  async function handleSolicitar(dados) {
    setSalvandoSolicitacao(true);
    setErroSolicitacao("");
    try {
      const nova = await criarSolicitacaoFerias(dados, user);
      setFerias((atual) => [...atual, nova]);
      setSolicitarAberto(false);
    } catch (e) {
      setErroSolicitacao(e.message || "Erro ao registrar solicitação de férias.");
    } finally {
      setSalvandoSolicitacao(false);
    }
  }

  async function handleAprovar(item) {
    const anterior = item.status;
    setFerias((atual) => atual.map((f) => (f.id === item.id ? { ...f, status: "Aprovada" } : f)));
    try {
      await aprovarFerias(item.id, user);
    } catch (e) {
      setFerias((atual) => atual.map((f) => (f.id === item.id ? { ...f, status: anterior } : f)));
      setErro(e.message || "Erro ao aprovar férias.");
    }
  }

  async function handleRecusar(motivo) {
    if (!feriasRecusando) return;
    setSalvandoRecusa(true);
    setErroRecusa("");
    try {
      const atualizada = await recusarFerias(feriasRecusando.id, motivo, user);
      setFerias((atual) => atual.map((f) => (f.id === atualizada.id ? atualizada : f)));
      setFeriasRecusando(null);
    } catch (e) {
      setErroRecusa(e.message || "Erro ao recusar férias.");
    } finally {
      setSalvandoRecusa(false);
    }
  }

  async function handleProrrogar(novaDataFim, motivo) {
    if (!feriasProrrogando) return;
    setSalvandoProrrogacao(true);
    setErroProrrogacao("");
    try {
      const atualizada = await prorrogarFerias(feriasProrrogando, novaDataFim, motivo, user);
      setFerias((atual) => atual.map((f) => (f.id === atualizada.id ? atualizada : f)));
      setFeriasProrrogando(null);
    } catch (e) {
      setErroProrrogacao(e.message || "Erro ao prorrogar férias.");
    } finally {
      setSalvandoProrrogacao(false);
    }
  }

  async function confirmarCancelamento() {
    if (!feriasCancelando) return;
    setCancelando(true);
    setErroCancelamento("");
    try {
      const atualizada = await cancelarFerias(feriasCancelando.id, "Cancelada pelo RH", user);
      setFerias((atual) => atual.map((f) => (f.id === atualizada.id ? atualizada : f)));
      setFeriasCancelando(null);
    } catch (e) {
      setErroCancelamento(e.message || "Erro ao cancelar férias.");
    } finally {
      setCancelando(false);
    }
  }

  async function handleAjustarSaldo(ajusteDias, motivo, historicoOk) {
    if (!colaboradorAjustando) return;
    setSalvandoAjuste(true);
    setErroAjuste("");
    try {
      if (isSupabaseConfigured) {
        const atualizado = await atualizarAjusteFeriasColaborador(colaboradorAjustando.id, ajusteDias, motivo, historicoOk, user);
        setColaboradores((atual) => atual.map((c) => (c.id === atualizado.id ? atualizado : c)));
      } else {
        setColaboradores((atual) =>
          atual.map((c) =>
            c.id === colaboradorAjustando.id
              ? { ...c, feriasAjusteDias: ajusteDias, feriasAjusteMotivo: motivo, feriasHistoricoOk: historicoOk }
              : c
          )
        );
      }
      setColaboradorAjustando(null);
    } catch (e) {
      setErroAjuste(e.message || "Erro ao ajustar saldo.");
    } finally {
      setSalvandoAjuste(false);
    }
  }

  const saldoProrrogando = feriasProrrogando
    ? calcularSaldoFerias(colaboradores.find((c) => c.id === feriasProrrogando.colaboradorId), ferias)
    : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gestão de Férias</h1>
          <div className="page-subtitle">Solicitações, aprovação e saldo de férias por colaborador</div>
        </div>
        <button className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => {
          setErroSolicitacao("");
          setSolicitarAberto(true);
        }}>
          <Plus size={16} /> Solicitar férias
        </button>
      </div>

      <div className="view-switch">
        <button
          type="button"
          className={"view-switch-btn" + (visualizacao === "solicitacoes" ? " active" : "")}
          onClick={() => setVisualizacao("solicitacoes")}
        >
          <ListChecks size={15} /> Solicitações
        </button>
        <button
          type="button"
          className={"view-switch-btn" + (visualizacao === "saldo" ? " active" : "")}
          onClick={() => setVisualizacao("saldo")}
        >
          <Wallet size={15} /> Saldo de férias
        </button>
      </div>

      {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

      {carregando ? (
        <div className="section-hint">Carregando férias…</div>
      ) : visualizacao === "solicitacoes" ? (
        <>
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <div className="section-title">
              Pendentes de aprovação <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({pendentes.length})</span>
            </div>
            <DataTable
              columns={[
                {
                  key: "colaborador",
                  label: "Colaborador",
                  render: (r) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar nome={r.colaborador?.nome} foto={r.colaborador?.foto} size={28} />
                      <span>{r.colaborador?.nome ?? "Colaborador não encontrado"}</span>
                    </div>
                  ),
                },
                { key: "periodo", label: "Período", render: (r) => `${formatDate(r.dataInicio)} a ${formatDate(r.dataFim)}` },
                { key: "dias", label: "Dias" },
                { key: "observacaoColaborador", label: "Observação", render: (r) => r.observacaoColaborador || "—" },
                {
                  key: "ultimaEdicao",
                  label: "Última edição",
                  render: (r) => (
                    <UltimaEdicaoBadge
                      nome={r.atualizadoPor}
                      data={r.atualizadoEm}
                      tabela="rh_ferias_solicitacoes"
                      registroId={r.id}
                      titulo={r.colaborador?.nome}
                    />
                  ),
                },
                {
                  key: "acoes",
                  label: "",
                  render: (r) => (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                        onClick={() => handleAprovar(r)}
                      >
                        <Check size={13} /> Aprovar
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: "5px 10px", fontSize: 12, color: "var(--color-danger)", display: "inline-flex", alignItems: "center", gap: 6 }}
                        onClick={() => {
                          setErroRecusa("");
                          setFeriasRecusando(r);
                        }}
                      >
                        <XIcon size={13} /> Recusar
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={pendentes}
              rowKey="id"
            />
          </div>

          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <div className="section-title">
              Aprovadas <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({aprovadas.length})</span>
            </div>
            <DataTable
              columns={[
                {
                  key: "colaborador",
                  label: "Colaborador",
                  render: (r) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar nome={r.colaborador?.nome} foto={r.colaborador?.foto} size={28} />
                      <span>{r.colaborador?.nome ?? "Colaborador não encontrado"}</span>
                    </div>
                  ),
                },
                { key: "periodo", label: "Período", render: (r) => `${formatDate(r.dataInicio)} a ${formatDate(r.dataFim)}` },
                { key: "dias", label: "Dias" },
                { key: "statusGozo", label: "Status", render: (r) => <span className={`badge ${GOZO_BADGE[r.statusGozo]}`}>{r.statusGozo}</span> },
                {
                  key: "prorrogacoes",
                  label: "Prorrogações",
                  render: (r) => (r.prorrogacoes.length > 0 ? `${r.prorrogacoes.length}x` : "—"),
                },
                {
                  key: "ultimaEdicao",
                  label: "Última edição",
                  render: (r) => (
                    <UltimaEdicaoBadge
                      nome={r.atualizadoPor}
                      data={r.atualizadoEm}
                      tabela="rh_ferias_solicitacoes"
                      registroId={r.id}
                      titulo={r.colaborador?.nome}
                    />
                  ),
                },
                {
                  key: "acoes",
                  label: "",
                  render: (r) => (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                        onClick={() => {
                          setErroProrrogacao("");
                          setFeriasProrrogando(r);
                        }}
                      >
                        <CalendarPlus size={13} /> Prorrogar
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                        onClick={() => {
                          setErroCancelamento("");
                          setFeriasCancelando(r);
                        }}
                      >
                        <Undo2 size={13} /> Cancelar
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={aprovadas}
              rowKey="id"
            />
          </div>

          {historico.length > 0 && (
            <div className="card card-pad">
              <div className="section-title">Histórico (recusadas e canceladas)</div>
              <DataTable
                columns={[
                  {
                    key: "colaborador",
                    label: "Colaborador",
                    render: (r) => r.colaborador?.nome ?? "Colaborador não encontrado",
                  },
                  { key: "periodo", label: "Período", render: (r) => `${formatDate(r.dataInicio)} a ${formatDate(r.dataFim)}` },
                  { key: "status", label: "Status", render: (r) => <span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status}</span> },
                  { key: "observacaoRh", label: "Motivo", render: (r) => r.observacaoRh || "—" },
                  {
                    key: "ultimaEdicao",
                    label: "Última edição",
                    render: (r) => (
                      <UltimaEdicaoBadge
                        nome={r.atualizadoPor}
                        data={r.atualizadoEm}
                        tabela="rh_ferias_solicitacoes"
                        registroId={r.id}
                        titulo={r.colaborador?.nome}
                      />
                    ),
                  },
                ]}
                rows={historico}
                rowKey="id"
              />
            </div>
          )}
        </>
      ) : (
        <>
          {atrasadas.length > 0 && (
            <div className="card card-pad" style={{ marginBottom: 20, borderLeft: "3px solid var(--color-danger)" }}>
              <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-danger)" }}>
                <AlertTriangle size={16} /> Férias atrasadas (vencidas){" "}
                <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({atrasadas.length})</span>
              </div>
              <div className="section-hint" style={{ marginBottom: 14 }}>
                Passou o período concessivo (12 meses após o fim do período aquisitivo) sem os dias serem gozados —
                pela CLT, esses dias viram pagamento em dobro quando forem tirados/pagos. Valor abaixo é uma
                estimativa (dias não gozados × 1/3 constitucional × 2) — confirme com o financeiro/DP antes de
                usar em folha de pagamento.
              </div>
              <DataTable
                columns={[
                  {
                    key: "colaborador",
                    label: "Colaborador",
                    render: (r) => (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar nome={r.colaborador.nome} foto={r.colaborador.foto} size={28} />
                        <span>{r.colaborador.nome}</span>
                      </div>
                    ),
                  },
                  { key: "venceuEm", label: "Venceu em", render: (r) => formatDate(r.saldo.periodoConcessivo.fim) },
                  { key: "diasEmAtraso", label: "Há quantos dias", render: (r) => `${r.saldo.diasEmAtraso} dias` },
                  { key: "diasVencidos", label: "Dias não gozados", render: (r) => <strong>{r.saldo.diasVencidos}</strong> },
                  {
                    key: "valorEstimadoDobro",
                    label: "Valor estimado (dobro)",
                    render: (r) => (r.colaborador.salario ? formatMoeda(r.saldo.valorEstimadoDobro) : "—"),
                  },
                ]}
                rows={atrasadas}
                rowKey="id"
              />
            </div>
          )}

          <div className="card card-pad">
          <div className="section-title">Saldo por colaborador</div>
          <div className="section-hint" style={{ marginBottom: 14 }}>
            Calculado automaticamente pela CLT: 30 dias a cada 12 meses trabalhados (período aquisitivo), a gozar
            nos 12 meses seguintes (período concessivo).
          </div>
          <DataTable
            columns={[
              {
                key: "colaborador",
                label: "Colaborador",
                render: (r) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar nome={r.colaborador.nome} foto={r.colaborador.foto} size={28} />
                    <span>{r.colaborador.nome}</span>
                  </div>
                ),
              },
              {
                key: "periodoAquisitivo",
                label: "Período aquisitivo",
                render: (r) => (r.saldo.temPeriodoDisponivel ? `${formatDate(r.saldo.periodoAquisitivo.inicio)} a ${formatDate(r.saldo.periodoAquisitivo.fim)}` : "Em aquisição"),
              },
              {
                key: "periodoConcessivo",
                label: "Limite para gozo",
                render: (r) => (r.saldo.temPeriodoDisponivel ? formatDate(r.saldo.periodoConcessivo.fim) : "—"),
              },
              {
                key: "diasUsados",
                label: "Dias usados",
                render: (r) => (
                  <>
                    {r.saldo.diasUsados}
                    {r.saldo.ajusteDias ? (
                      <span style={{ color: "var(--color-text-muted)", fontSize: 11 }}> (ajuste manual: {r.saldo.ajusteDias})</span>
                    ) : null}
                    {r.saldo.historicoOk ? (
                      <span style={{ color: "var(--color-text-muted)", fontSize: 11 }}> · histórico anterior zerado</span>
                    ) : null}
                  </>
                ),
              },
              { key: "diasDisponiveis", label: "Saldo disponível", render: (r) => <strong>{r.saldo.diasDisponiveis}</strong> },
              {
                key: "alerta",
                label: "",
                render: (r) => (r.saldo.vencidas ? <span className="badge badge-danger">Vencidas</span> : null),
              },
              {
                key: "acoes",
                label: "",
                render: (r) => (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                    onClick={() => {
                      setErroAjuste("");
                      setColaboradorAjustando(r.colaborador);
                    }}
                  >
                    <SlidersHorizontal size={13} /> Ajustar saldo
                  </button>
                ),
              },
            ]}
            rows={saldos}
            rowKey="id"
          />
          </div>
        </>
      )}

      {solicitarAberto && (
        <SolicitarFeriasModal
          colaboradores={colaboradoresAtivos}
          ferias={ferias}
          onFechar={() => setSolicitarAberto(false)}
          onConfirmar={handleSolicitar}
          salvando={salvandoSolicitacao}
          erro={erroSolicitacao}
        />
      )}

      {feriasRecusando && (
        <RecusarFeriasModal
          colaborador={feriasRecusando.colaborador}
          onFechar={() => setFeriasRecusando(null)}
          onSalvar={handleRecusar}
          salvando={salvandoRecusa}
          erro={erroRecusa}
        />
      )}

      {feriasProrrogando && (
        <ProrrogarFeriasModal
          ferias={feriasProrrogando}
          colaborador={colaboradores.find((c) => c.id === feriasProrrogando.colaboradorId)}
          saldoDisponivel={saldoProrrogando?.diasDisponiveis ?? 0}
          onFechar={() => setFeriasProrrogando(null)}
          onConfirmar={handleProrrogar}
          salvando={salvandoProrrogacao}
          erro={erroProrrogacao}
        />
      )}

      {colaboradorAjustando && (
        <AjustarSaldoFeriasModal
          colaborador={colaboradorAjustando}
          saldo={calcularSaldoFerias(colaboradorAjustando, ferias)}
          onFechar={() => setColaboradorAjustando(null)}
          onSalvar={handleAjustarSaldo}
          salvando={salvandoAjuste}
          erro={erroAjuste}
        />
      )}

      {feriasCancelando && (
        <ConfirmDeleteModal
          titulo="Cancelar férias"
          mensagem={`Tem certeza que deseja cancelar as férias aprovadas de "${
            colaboradores.find((c) => c.id === feriasCancelando.colaboradorId)?.nome ?? "colaborador"
          }"?`}
          confirmando={cancelando}
          erro={erroCancelamento}
          textoConfirmar="Cancelar férias"
          textoConfirmando="Cancelando…"
          onConfirmar={confirmarCancelamento}
          onCancelar={() => setFeriasCancelando(null)}
        />
      )}
    </div>
  );
}
