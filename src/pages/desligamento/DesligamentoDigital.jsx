import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  MapPin,
  CalendarClock,
  Undo2,
  ListChecks,
  Kanban,
  Paperclip,
  Users,
  Upload,
  History,
} from "lucide-react";
import Avatar from "../../components/Avatar";
import DataTable from "../../components/DataTable";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import ObservacaoDesligamentoModal from "./ObservacaoDesligamentoModal";
import HistoricoEtapasModal from "../../components/HistoricoEtapasModal";
import AnexarDocumentosModal from "../../components/AnexarDocumentosModal";
import ImportarDesligamentosForm from "./ImportarDesligamentosForm";
import { COLABORADORES } from "../../data/mock/colaboradores";
import { useAuth } from "../../context/AuthContext";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { listarColaboradores, atualizarStatusColaborador } from "../../lib/colaboradoresApi";
import {
  listarDesligamentos,
  atualizarChecklistDesligamento,
  excluirDesligamento,
  enviarDesligamentoParaChecklist,
  atualizarObservacaoDesligamento,
  importarDesligamentos,
  DOCUMENTOS_ETAPAS_DESLIGAMENTO,
} from "../../lib/desligamentoApi";
import { anexarDocumentoChecklist, removerDocumentoChecklist } from "../../lib/documentosChecklistApi";
import { formatDate, formatFilial } from "../../utils/format";

const CHECKLIST_LABELS = {
  entrevistaDesligamento: "Entrevista de desligamento",
  devolucaoEquipamentos: "Devolução de equipamentos e EPIs",
  exameDemissional: "Exame demissional",
  acertoRescisorio: "Acerto rescisório",
};

const ETAPAS_KANBAN = Object.keys(CHECKLIST_LABELS);
const COLUNA_CONCLUIDO = "concluido";
const COLUNAS_KANBAN = [
  ...ETAPAS_KANBAN.map((chave) => ({ id: chave, titulo: CHECKLIST_LABELS[chave] })),
  { id: COLUNA_CONCLUIDO, titulo: "Concluído" },
];
const TITULOS_COLUNA = Object.fromEntries(COLUNAS_KANBAN.map((c) => [c.id, c.titulo]));

function getColunaAtual(checklist) {
  return ETAPAS_KANBAN.find((chave) => !checklist[chave]) ?? COLUNA_CONCLUIDO;
}

function criarEntradaHistorico(descricao, user) {
  return {
    descricao,
    data: new Date().toISOString(),
    usuarioId: user?.id ?? null,
    usuarioNome: user?.nome ?? "Usuário desconhecido",
  };
}

// Toda ação que altera o checklist (arrastar no Kanban, marcar etapa manualmente
// ou anexar/remover documento) pode mudar a "etapa atual" derivada — quando isso
// acontece, registramos automaticamente quem moveu o card e quando.
function comHistoricoDeMovimento(desligamento, checklistNovo, user) {
  const colunaAntes = getColunaAtual(desligamento.checklist);
  const colunaDepois = getColunaAtual(checklistNovo);
  if (colunaAntes === colunaDepois) return desligamento.historico || [];
  const descricao = `Movido de "${TITULOS_COLUNA[colunaAntes]}" para "${TITULOS_COLUNA[colunaDepois]}"`;
  return [...(desligamento.historico || []), criarEntradaHistorico(descricao, user)];
}

function getStatus(pct) {
  if (pct === 100) return { label: "Concluído", badgeClass: "badge-success" };
  if (pct >= 50) return { label: "Em andamento", badgeClass: "badge-info" };
  return { label: "Iniciando", badgeClass: "badge-warning" };
}

export default function DesligamentoDigital() {
  const { user } = useAuth();
  const [colaboradores, setColaboradores] = useState(isSupabaseConfigured ? [] : COLABORADORES);
  const [desligamentos, setDesligamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [desligamentoParaCancelar, setDesligamentoParaCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState("");
  const [visualizacao, setVisualizacao] = useState("kanban");
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverColuna, setDragOverColuna] = useState(null);
  const [desligamentoObservandoId, setDesligamentoObservandoId] = useState(null);
  const [salvandoObservacao, setSalvandoObservacao] = useState(false);
  const [erroObservacao, setErroObservacao] = useState("");
  const [documentoEtapa, setDocumentoEtapa] = useState(null);
  const [importAberto, setImportAberto] = useState(false);
  const [importVisitado, setImportVisitado] = useState(false);
  const [historicoId, setHistoricoId] = useState(null);

  const desligamentosNoChecklist = desligamentos.filter((d) => d.emChecklist);
  const desligamentoObservando = desligamentos.find((d) => d.id === desligamentoObservandoId) ?? null;
  const desligamentoHistorico = desligamentos.find((d) => d.id === historicoId) ?? null;
  const desligamentoDocumento = documentoEtapa
    ? desligamentos.find((d) => d.id === documentoEtapa.desligamentoId) ?? null
    : null;

  useEffect(() => {
    const carregarColaboradores = isSupabaseConfigured
      ? listarColaboradores()
          .then(setColaboradores)
          .catch((e) => setErro(e.message || "Erro ao carregar colaboradores."))
      : Promise.resolve();
    const carregarDesligamentos = listarDesligamentos()
      .then(setDesligamentos)
      .catch((e) => setErro(e.message || "Erro ao carregar desligamentos."));
    Promise.all([carregarColaboradores, carregarDesligamentos]).finally(() => setCarregando(false));
  }, []);

  async function handleToggleEtapa(desligamento, chave) {
    if (DOCUMENTOS_ETAPAS_DESLIGAMENTO[chave]) {
      setDocumentoEtapa({ desligamentoId: desligamento.id, chave });
      return;
    }
    const checklistAnterior = desligamento.checklist;
    const historicoAnterior = desligamento.historico || [];
    const checklist = { ...checklistAnterior, [chave]: !checklistAnterior[chave] };
    const historico = comHistoricoDeMovimento(desligamento, checklist, user);
    setDesligamentos((atual) => atual.map((d) => (d.id === desligamento.id ? { ...d, checklist, historico } : d)));
    try {
      await atualizarChecklistDesligamento(desligamento.id, checklist, historico);
    } catch (e) {
      setDesligamentos((atual) =>
        atual.map((d) => (d.id === desligamento.id ? { ...d, checklist: checklistAnterior, historico: historicoAnterior } : d))
      );
      setErro(e.message || "Erro ao atualizar etapa.");
    }
  }

  async function handleAnexarDocumentoEtapa(desligamento, chave, arquivo) {
    const checklistAnterior = desligamento.checklist;
    const historicoAnterior = desligamento.historico || [];
    const anexoChave = `${chave}Anexo`;
    const anexo = await anexarDocumentoChecklist(`desligamento/${desligamento.id}`, arquivo);
    const checklist = { ...checklistAnterior, [anexoChave]: anexo, [chave]: true };
    const historico = comHistoricoDeMovimento(desligamento, checklist, user);
    setDesligamentos((atual) => atual.map((d) => (d.id === desligamento.id ? { ...d, checklist, historico } : d)));
    try {
      await atualizarChecklistDesligamento(desligamento.id, checklist, historico);
    } catch (e) {
      setDesligamentos((atual) =>
        atual.map((d) => (d.id === desligamento.id ? { ...d, checklist: checklistAnterior, historico: historicoAnterior } : d))
      );
      throw e;
    }
  }

  async function handleRemoverDocumentoEtapa(desligamento, chave) {
    const checklistAnterior = desligamento.checklist;
    const historicoAnterior = desligamento.historico || [];
    const anexoChave = `${chave}Anexo`;
    const anexoAtual = checklistAnterior[anexoChave];
    const checklist = { ...checklistAnterior, [anexoChave]: null, [chave]: false };
    const historico = comHistoricoDeMovimento(desligamento, checklist, user);
    setDesligamentos((atual) => atual.map((d) => (d.id === desligamento.id ? { ...d, checklist, historico } : d)));
    try {
      await removerDocumentoChecklist(anexoAtual?.path);
      await atualizarChecklistDesligamento(desligamento.id, checklist, historico);
    } catch (e) {
      setDesligamentos((atual) =>
        atual.map((d) => (d.id === desligamento.id ? { ...d, checklist: checklistAnterior, historico: historicoAnterior } : d))
      );
      throw e;
    }
  }

  function handleDropColuna(colunaId) {
    const desligamento = desligamentos.find((d) => d.id === draggingId);
    setDraggingId(null);
    setDragOverColuna(null);
    if (!desligamento || getColunaAtual(desligamento.checklist) === colunaId) return;

    const indiceAlvo = colunaId === COLUNA_CONCLUIDO ? ETAPAS_KANBAN.length : ETAPAS_KANBAN.indexOf(colunaId);
    const checklistAnterior = desligamento.checklist;
    const historicoAnterior = desligamento.historico || [];

    const etapaSemAnexo = ETAPAS_KANBAN.slice(0, indiceAlvo).find(
      (chave) => DOCUMENTOS_ETAPAS_DESLIGAMENTO[chave] && !checklistAnterior[`${chave}Anexo`]
    );
    if (etapaSemAnexo) {
      setErro(`Anexe o documento de "${CHECKLIST_LABELS[etapaSemAnexo]}" pelo checklist antes de avançar essa etapa.`);
      return;
    }

    const checklist = { ...checklistAnterior };
    ETAPAS_KANBAN.forEach((chave, i) => {
      checklist[chave] = i < indiceAlvo;
    });
    const historico = comHistoricoDeMovimento(desligamento, checklist, user);
    setDesligamentos((atual) => atual.map((d) => (d.id === desligamento.id ? { ...d, checklist, historico } : d)));
    atualizarChecklistDesligamento(desligamento.id, checklist, historico).catch((e) => {
      setDesligamentos((atual) =>
        atual.map((d) => (d.id === desligamento.id ? { ...d, checklist: checklistAnterior, historico: historicoAnterior } : d))
      );
      setErro(e.message || "Erro ao mover etapa.");
    });
  }

  async function handleEnviarChecklist(desligamento) {
    setDesligamentos((atual) => atual.map((d) => (d.id === desligamento.id ? { ...d, emChecklist: true } : d)));
    try {
      await enviarDesligamentoParaChecklist(desligamento.id);
    } catch (e) {
      setDesligamentos((atual) => atual.map((d) => (d.id === desligamento.id ? { ...d, emChecklist: false } : d)));
      setErro(e.message || "Erro ao enviar para o checklist.");
    }
  }

  function abrirHistorico(desligamento) {
    setHistoricoId(desligamento.id);
  }

  function abrirObservacao(desligamento) {
    setErroObservacao("");
    setDesligamentoObservandoId(desligamento.id);
  }

  function fecharObservacao() {
    if (salvandoObservacao) return;
    setDesligamentoObservandoId(null);
    setErroObservacao("");
  }

  async function handleSalvarObservacao(observacao) {
    if (!desligamentoObservando) return;
    const observacaoAnterior = desligamentoObservando.observacao;
    setSalvandoObservacao(true);
    setErroObservacao("");
    try {
      setDesligamentos((atual) =>
        atual.map((d) => (d.id === desligamentoObservando.id ? { ...d, observacao } : d))
      );
      await atualizarObservacaoDesligamento(desligamentoObservando.id, observacao);
      setDesligamentoObservandoId(null);
    } catch (e) {
      setDesligamentos((atual) =>
        atual.map((d) => (d.id === desligamentoObservando.id ? { ...d, observacao: observacaoAnterior } : d))
      );
      setErroObservacao(e.message || "Erro ao salvar observação.");
    } finally {
      setSalvandoObservacao(false);
    }
  }

  function handleCancelar(desligamento) {
    setErroCancelamento("");
    setDesligamentoParaCancelar(desligamento);
  }

  function fecharModalCancelamento() {
    if (cancelando) return;
    setDesligamentoParaCancelar(null);
    setErroCancelamento("");
  }

  async function confirmarCancelamento() {
    const desligamento = desligamentoParaCancelar;
    if (!desligamento) return;
    setCancelando(true);
    setErroCancelamento("");
    try {
      await excluirDesligamento(desligamento.id);
      if (isSupabaseConfigured) {
        try {
          await atualizarStatusColaborador(desligamento.colaboradorId, "Ativo");
        } catch {
          // Colaborador pode não existir mais na base (ex.: removido em uma limpeza).
          // O desligamento já foi excluído acima — não deixamos isso travar o cancelamento.
        }
      }
      setColaboradores((atual) =>
        atual.map((c) => (c.id === desligamento.colaboradorId ? { ...c, status: "Ativo" } : c))
      );
      setDesligamentos((atual) => atual.filter((d) => d.id !== desligamento.id));
      setDesligamentoParaCancelar(null);
    } catch (e) {
      setErroCancelamento(e.message || "Erro ao cancelar desligamento.");
    } finally {
      setCancelando(false);
    }
  }

  async function handleImportarDesligamentos(linhas) {
    const novos = await importarDesligamentos(linhas);
    setDesligamentos((atual) => [...atual, ...novos]);
    const colaboradorIds = new Set(linhas.map((l) => l.colaboradorId));
    if (isSupabaseConfigured) {
      await Promise.all(
        linhas.map((l) => atualizarStatusColaborador(l.colaboradorId, "Desligado").catch(() => {}))
      );
    }
    setColaboradores((atual) =>
      atual.map((c) => (colaboradorIds.has(c.id) ? { ...c, status: "Desligado" } : c))
    );
    setImportAberto(false);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Desligamento Digital</h1>
          <div className="page-subtitle">Checklist de saída, devolução de equipamentos e acerto rescisório</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => {
              setImportVisitado(true);
              setImportAberto((v) => !v);
            }}
          >
            <Upload size={16} /> Importar desligamentos
          </button>
        </div>
      </div>

      <div className={`collapse ${importAberto ? "open" : ""}`}>
        <div className="collapse-inner">
          {importVisitado && (
            <div className="collapse-content">
              <ImportarDesligamentosForm
                colaboradores={colaboradores}
                onCancelar={() => setImportAberto(false)}
                onImportar={handleImportarDesligamentos}
              />
            </div>
          )}
        </div>
      </div>

      <div className="view-switch">
        <button
          type="button"
          className={"view-switch-btn" + (visualizacao === "kanban" ? " active" : "")}
          onClick={() => setVisualizacao("kanban")}
        >
          <Kanban size={15} /> Kanban
        </button>
        <button
          type="button"
          className={"view-switch-btn" + (visualizacao === "checklist" ? " active" : "")}
          onClick={() => setVisualizacao("checklist")}
        >
          <ListChecks size={15} /> Checklist
        </button>
        <button
          type="button"
          className={"view-switch-btn" + (visualizacao === "todos" ? " active" : "")}
          onClick={() => setVisualizacao("todos")}
        >
          <Users size={15} /> Todos
        </button>
      </div>

      {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

      {carregando ? (
        <div className="section-hint">Carregando desligamentos…</div>
      ) : desligamentos.length === 0 ? (
        <div className="section-hint">
          Nenhum desligamento em andamento. Um desligamento é criado automaticamente ao clicar em "Desligar" no
          Cadastro de Colaboradores.
        </div>
      ) : visualizacao === "kanban" ? (
        <div className="kanban-board">
          {COLUNAS_KANBAN.map((coluna) => {
            const itens = desligamentos.filter((d) => getColunaAtual(d.checklist) === coluna.id);
            return (
              <div
                key={coluna.id}
                className={"card card-pad kanban-column" + (dragOverColuna === coluna.id ? " kanban-column-over" : "")}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColuna(coluna.id);
                }}
                onDragLeave={() => setDragOverColuna((id) => (id === coluna.id ? null : id))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropColuna(coluna.id);
                }}
              >
                <div className="section-title">
                  {coluna.titulo}{" "}
                  <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({itens.length})</span>
                </div>
                {itens.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Nenhum colaborador nesta etapa.</div>
                )}
                {itens.map((desl) => {
                  const colaborador = colaboradores.find((c) => c.id === desl.colaboradorId);
                  return (
                    <div
                      key={desl.id}
                      className={"card card-pad kanban-card" + (draggingId === desl.id ? " kanban-card-dragging" : "")}
                      style={{ marginBottom: 10, boxShadow: "none" }}
                      draggable
                      onDragStart={() => setDraggingId(desl.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverColuna(null);
                      }}
                      onClick={() => abrirObservacao(desl)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar nome={colaborador?.nome} foto={colaborador?.foto} size={28} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{colaborador?.nome ?? "Colaborador não encontrado"}</div>
                          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{colaborador?.cargo}</div>
                        </div>
                      </div>
                      {desl.motivo && (
                        <div style={{ fontSize: 11, marginTop: 6 }}>
                          <span className="badge badge-info">{desl.motivo}</span>
                        </div>
                      )}
                      <div className={"kanban-card-fase" + (desl.observacao ? " kanban-card-fase-preenchida" : "")}>
                        {desl.observacao || "Clique para ver e editar…"}
                      </div>
                      {DOCUMENTOS_ETAPAS_DESLIGAMENTO[coluna.id] && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 8,
                            width: "100%",
                            justifyContent: "center",
                            fontSize: 12,
                            padding: "6px 10px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocumentoEtapa({ desligamentoId: desl.id, chave: coluna.id });
                          }}
                        >
                          <Paperclip size={13} /> Anexar documento
                        </button>
                      )}
                      {coluna.id === COLUNA_CONCLUIDO && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 8,
                            width: "100%",
                            justifyContent: "center",
                            fontSize: 12,
                            padding: "6px 10px",
                          }}
                          disabled={desl.emChecklist}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnviarChecklist(desl);
                          }}
                        >
                          <ListChecks size={13} />
                          {desl.emChecklist ? "Enviado ao checklist" : "Enviar para o checklist"}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 8,
                          width: "100%",
                          justifyContent: "center",
                          fontSize: 11,
                          padding: "5px 8px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirHistorico(desl);
                        }}
                      >
                        <History size={12} /> Ver histórico
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 8,
                          width: "100%",
                          justifyContent: "center",
                          fontSize: 11,
                          padding: "5px 8px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelar(desl);
                        }}
                      >
                        <Undo2 size={12} /> Cancelar
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : visualizacao === "checklist" ? (
        desligamentosNoChecklist.length === 0 ? (
        <div className="section-hint">
          Nenhum desligamento chegou ao checklist ainda. Conclua todas as etapas no Kanban e clique em "Enviar
          para o checklist" para liberar aqui.
        </div>
      ) : (
        <div className="grid grid-2">
          {desligamentosNoChecklist.map((desl) => {
            const colaborador = colaboradores.find((c) => c.id === desl.colaboradorId);
            const etapas = Object.keys(CHECKLIST_LABELS).map((chave) => [chave, desl.checklist[chave]]);
            const concluidas = etapas.filter(([, v]) => v).length;
            const pct = Math.round((concluidas / etapas.length) * 100);
            const status = getStatus(pct);
            return (
              <div className="card admissao-card" key={desl.id}>
                <div className="admissao-card-header">
                  <Avatar nome={colaborador?.nome} foto={colaborador?.foto} size={40} />
                  <div className="admissao-card-title">
                    <div className="admissao-name">{colaborador?.nome ?? "Colaborador não encontrado"}</div>
                    <div className="admissao-cargo">{colaborador?.cargo} · {desl.motivo}</div>
                  </div>
                  <span className={`badge ${status.badgeClass}`}>{status.label}</span>
                </div>

                <div className="admissao-meta">
                  <span>
                    <MapPin size={13} /> {formatFilial(colaborador?.filial)}
                  </span>
                  <span>
                    <CalendarClock size={13} /> Desligamento: {formatDate(desl.dataDesligamento)}
                  </span>
                </div>

                <div className="admissao-progress">
                  <div className="admissao-progress-bar">
                    <div className="admissao-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="admissao-progress-label">
                    {concluidas}/{etapas.length} etapas concluídas · {pct}%
                  </span>
                </div>

                <div className="admissao-checklist">
                  {etapas.map(([key, done]) => {
                    const comAnexo = Boolean(DOCUMENTOS_ETAPAS_DESLIGAMENTO[key]);
                    return (
                      <div
                        key={key}
                        className={`admissao-step ${done ? "done" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleToggleEtapa(desl, key)}
                      >
                        <span className="admissao-step-icon">
                          {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        </span>
                        <span className="admissao-step-label">
                          {CHECKLIST_LABELS[key]}
                          {comAnexo && !done && (
                            <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}> · anexar documento</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 14, textAlign: "right" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                    onClick={() => handleCancelar(desl)}
                  >
                    <Undo2 size={13} /> Cancelar desligamento
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )
      ) : (
        <DataTable
          columns={[
            {
              key: "nome",
              label: "Colaborador",
              render: (d) => {
                const colaborador = colaboradores.find((c) => c.id === d.colaboradorId);
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar nome={colaborador?.nome} foto={colaborador?.foto} size={26} />
                    <span>{colaborador?.nome ?? "Colaborador não encontrado"}</span>
                  </div>
                );
              },
            },
            {
              key: "filial",
              label: "Filial",
              render: (d) => formatFilial(colaboradores.find((c) => c.id === d.colaboradorId)?.filial) ?? "—",
            },
            { key: "motivo", label: "Motivo", render: (d) => d.motivo || "—" },
            { key: "data", label: "Data desligamento", render: (d) => formatDate(d.dataDesligamento) },
            {
              key: "situacao",
              label: "Situação",
              render: (d) => {
                const etapas = Object.keys(CHECKLIST_LABELS).map((chave) => d.checklist[chave]);
                const pct = Math.round((etapas.filter(Boolean).length / etapas.length) * 100);
                const status = getStatus(pct);
                return <span className={`badge ${status.badgeClass}`}>{status.label}</span>;
              },
            },
            {
              key: "acao",
              label: "",
              render: (d) => (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: "5px 10px", fontSize: 12 }}
                    onClick={() => abrirObservacao(d)}
                  >
                    Ver observação
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: "5px 10px", fontSize: 12 }}
                    onClick={() => abrirHistorico(d)}
                  >
                    Ver histórico
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: "5px 10px", fontSize: 12 }}
                    onClick={() => handleCancelar(d)}
                  >
                    Cancelar
                  </button>
                </div>
              ),
            },
          ]}
          rows={desligamentos}
          rowKey="id"
        />
      )}

      {desligamentoDocumento && (
        <AnexarDocumentosModal
          titulo={`${CHECKLIST_LABELS[documentoEtapa.chave]} — ${
            colaboradores.find((c) => c.id === desligamentoDocumento.colaboradorId)?.nome ?? "Colaborador não encontrado"
          }`}
          documentos={[DOCUMENTOS_ETAPAS_DESLIGAMENTO[documentoEtapa.chave]]}
          anexos={{
            [DOCUMENTOS_ETAPAS_DESLIGAMENTO[documentoEtapa.chave].chave]:
              desligamentoDocumento.checklist[`${documentoEtapa.chave}Anexo`],
          }}
          onAnexar={(_docChave, arquivo) => handleAnexarDocumentoEtapa(desligamentoDocumento, documentoEtapa.chave, arquivo)}
          onRemover={() => handleRemoverDocumentoEtapa(desligamentoDocumento, documentoEtapa.chave)}
          onFechar={() => setDocumentoEtapa(null)}
        />
      )}

      {desligamentoParaCancelar && (
        <ConfirmDeleteModal
          titulo="Cancelar desligamento"
          mensagem={`Tem certeza que deseja cancelar o desligamento de "${
            colaboradores.find((c) => c.id === desligamentoParaCancelar.colaboradorId)?.nome ?? "colaborador"
          }"? O colaborador voltará a ficar Ativo e o checklist será removido.`}
          confirmando={cancelando}
          erro={erroCancelamento}
          textoConfirmar="Cancelar desligamento"
          textoConfirmando="Cancelando…"
          onConfirmar={confirmarCancelamento}
          onCancelar={fecharModalCancelamento}
        />
      )}

      {desligamentoObservando && (
        <ObservacaoDesligamentoModal
          desligamento={desligamentoObservando}
          colaborador={colaboradores.find((c) => c.id === desligamentoObservando.colaboradorId)}
          onFechar={fecharObservacao}
          onSalvar={handleSalvarObservacao}
          salvando={salvandoObservacao}
          erro={erroObservacao}
        />
      )}

      {desligamentoHistorico && (
        <HistoricoEtapasModal
          titulo={colaboradores.find((c) => c.id === desligamentoHistorico.colaboradorId)?.nome ?? "Colaborador não encontrado"}
          historico={desligamentoHistorico.historico}
          onFechar={() => setHistoricoId(null)}
        />
      )}
    </div>
  );
}
