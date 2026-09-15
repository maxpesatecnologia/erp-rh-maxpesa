import { useEffect, useState } from "react";
import { CheckCircle2, Circle, MapPin, CalendarClock, X } from "lucide-react";
import Avatar from "../../components/Avatar";
import { listarAdmissoes, atualizarChecklistAdmissao, excluirAdmissao } from "../../lib/admissaoApi";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

const CHECKLIST_LABELS = {
  dadosPessoais: "Dados pessoais",
  documentos: "Upload de documentos",
  exameAdmissional: "Exame admissional",
  assinaturaContrato: "Assinatura eletrônica do contrato",
  integracaoDominio: "Envio ao Domínio Sistemas",
};

function getStatus(pct) {
  if (pct === 100) return { label: "Concluída", badgeClass: "badge-success" };
  if (pct >= 50) return { label: "Em andamento", badgeClass: "badge-info" };
  return { label: "Iniciando", badgeClass: "badge-warning" };
}

export default function AdmissaoDigital() {
  const [admissoes, setAdmissoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [admissaoParaExcluirId, setAdmissaoParaExcluirId] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

  const admissaoParaExcluir = admissoes.find((a) => a.id === admissaoParaExcluirId) ?? null;

  useEffect(() => {
    listarAdmissoes()
      .then(setAdmissoes)
      .catch((e) => setErro(e.message || "Erro ao carregar admissões."))
      .finally(() => setCarregando(false));
  }, []);

  function fecharModalExclusao() {
    if (excluindo) return;
    setAdmissaoParaExcluirId(null);
    setErroExclusao("");
  }

  async function confirmarExclusao() {
    if (!admissaoParaExcluir) return;
    setExcluindo(true);
    setErroExclusao("");
    try {
      await excluirAdmissao(admissaoParaExcluir.id);
      setAdmissoes((atual) => atual.filter((a) => a.id !== admissaoParaExcluir.id));
      setAdmissaoParaExcluirId(null);
    } catch (e) {
      setErroExclusao(e.message || "Erro ao cancelar admissão.");
    } finally {
      setExcluindo(false);
    }
  }

  async function handleToggleEtapa(admissao, chave) {
    const checklistAnterior = admissao.checklist;
    const checklist = { ...checklistAnterior, [chave]: !checklistAnterior[chave] };
    setAdmissoes((atual) => atual.map((a) => (a.id === admissao.id ? { ...a, checklist } : a)));
    try {
      await atualizarChecklistAdmissao(admissao.id, checklist);
    } catch (e) {
      setAdmissoes((atual) => atual.map((a) => (a.id === admissao.id ? { ...a, checklist: checklistAnterior } : a)));
      setErro(e.message || "Erro ao atualizar etapa.");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admissão Digital</h1>
          <div className="page-subtitle">Checklist, upload de documentos, assinatura eletrônica e workflow de aprovação</div>
        </div>
      </div>

      {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

      {carregando ? (
        <div className="section-hint">Carregando admissões…</div>
      ) : admissoes.length === 0 ? (
        <div className="section-hint">
          Nenhuma admissão em andamento. Uma admissão é criada automaticamente ao efetivar a contratação de um
          candidato em Recrutamento &amp; Seleção.
        </div>
      ) : (
        <div className="grid grid-2">
          {admissoes.map((adm) => {
            const etapas = Object.entries(adm.checklist);
            const concluidas = etapas.filter(([, v]) => v).length;
            const pct = Math.round((concluidas / etapas.length) * 100);
            const status = getStatus(pct);
            return (
              <div className="card admissao-card" key={adm.id}>
                <div className="admissao-card-header">
                  <Avatar nome={adm.nome} foto={adm.foto} size={44} />
                  <div className="admissao-card-title">
                    <div className="admissao-name">{adm.nome}</div>
                    <div className="admissao-cargo">{adm.cargo}</div>
                  </div>
                  <span className={`badge ${status.badgeClass}`}>{status.label}</span>
                  <button
                    type="button"
                    className="icon-btn icon-btn-danger"
                    aria-label="Cancelar admissão"
                    title="Cancelar admissão"
                    onClick={() => {
                      setErroExclusao("");
                      setAdmissaoParaExcluirId(adm.id);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="admissao-meta">
                  <span>
                    <MapPin size={13} /> {adm.filial}
                  </span>
                  <span>
                    <CalendarClock size={13} /> Previsão: {adm.dataPrevista}
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
                      onClick={() => handleToggleEtapa(adm, key)}
                    >
                      <span className="admissao-step-icon">
                        {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </span>
                      <span className="admissao-step-label">{CHECKLIST_LABELS[key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {admissaoParaExcluir && (
        <ConfirmDeleteModal
          titulo="Cancelar admissão"
          mensagem={`Tem certeza que deseja cancelar a admissão de "${admissaoParaExcluir.nome}"? Essa ação não pode ser desfeita.`}
          confirmando={excluindo}
          erro={erroExclusao}
          textoConfirmar="Cancelar admissão"
          textoConfirmando="Cancelando…"
          onConfirmar={confirmarExclusao}
          onCancelar={fecharModalExclusao}
        />
      )}
    </div>
  );
}
