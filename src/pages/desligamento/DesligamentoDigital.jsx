import { useEffect, useState } from "react";
import { CheckCircle2, Circle, MapPin, CalendarClock, Undo2 } from "lucide-react";
import Avatar from "../../components/Avatar";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { COLABORADORES } from "../../data/mock/colaboradores";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { listarColaboradores, atualizarStatusColaborador } from "../../lib/colaboradoresApi";
import { listarDesligamentos, atualizarChecklistDesligamento, excluirDesligamento } from "../../lib/desligamentoApi";

const CHECKLIST_LABELS = {
  entrevistaDesligamento: "Entrevista de desligamento",
  devolucaoEquipamentos: "Devolução de equipamentos e EPIs",
  exameDemissional: "Exame demissional",
  acertoRescisorio: "Acerto rescisório",
  homologacaoSindicato: "Homologação no sindicato",
  baixaDominio: "Baixa no Domínio Sistemas",
};

function getStatus(pct) {
  if (pct === 100) return { label: "Concluído", badgeClass: "badge-success" };
  if (pct >= 50) return { label: "Em andamento", badgeClass: "badge-info" };
  return { label: "Iniciando", badgeClass: "badge-warning" };
}

export default function DesligamentoDigital() {
  const [colaboradores, setColaboradores] = useState(isSupabaseConfigured ? [] : COLABORADORES);
  const [desligamentos, setDesligamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [desligamentoParaCancelar, setDesligamentoParaCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState("");

  useEffect(() => {
    if (isSupabaseConfigured) {
      listarColaboradores()
        .then(setColaboradores)
        .catch((e) => setErro(e.message || "Erro ao carregar colaboradores."));
    }
    listarDesligamentos()
      .then(setDesligamentos)
      .catch((e) => setErro(e.message || "Erro ao carregar desligamentos."))
      .finally(() => setCarregando(false));
  }, []);

  async function handleToggleEtapa(desligamento, chave) {
    const checklistAnterior = desligamento.checklist;
    const checklist = { ...checklistAnterior, [chave]: !checklistAnterior[chave] };
    setDesligamentos((atual) => atual.map((d) => (d.id === desligamento.id ? { ...d, checklist } : d)));
    try {
      await atualizarChecklistDesligamento(desligamento.id, checklist);
    } catch (e) {
      setDesligamentos((atual) => atual.map((d) => (d.id === desligamento.id ? { ...d, checklist: checklistAnterior } : d)));
      setErro(e.message || "Erro ao atualizar etapa.");
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
        await atualizarStatusColaborador(desligamento.colaboradorId, "Ativo");
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Desligamento Digital</h1>
          <div className="page-subtitle">Checklist de saída, devolução de equipamentos, acerto rescisório e baixa no Domínio</div>
        </div>
      </div>

      {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

      {carregando ? (
        <div className="section-hint">Carregando desligamentos…</div>
      ) : desligamentos.length === 0 ? (
        <div className="section-hint">
          Nenhum desligamento em andamento. Um desligamento é criado automaticamente ao clicar em "Desligar" no
          Cadastro de Colaboradores.
        </div>
      ) : (
        <div className="grid grid-2">
          {desligamentos.map((desl) => {
            const colaborador = colaboradores.find((c) => c.id === desl.colaboradorId);
            const etapas = Object.entries(desl.checklist);
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
                    <MapPin size={13} /> {colaborador?.filial}
                  </span>
                  <span>
                    <CalendarClock size={13} /> Desligamento: {desl.dataDesligamento}
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
                  {etapas.map(([key, done]) => (
                    <div
                      key={key}
                      className={`admissao-step ${done ? "done" : ""}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleToggleEtapa(desl, key)}
                    >
                      <span className="admissao-step-icon">
                        {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </span>
                      <span className="admissao-step-label">{CHECKLIST_LABELS[key]}</span>
                    </div>
                  ))}
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
    </div>
  );
}
