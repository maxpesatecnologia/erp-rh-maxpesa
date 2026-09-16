import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, MapPin, CalendarClock, X, UserPlus } from "lucide-react";
import Avatar from "../../components/Avatar";
import AnexarDocumentosModal from "../../components/AnexarDocumentosModal";
import { formatDate } from "../../utils/format";
import {
  listarAdmissoes,
  atualizarChecklistAdmissao,
  excluirAdmissao,
  DOCUMENTOS_PESSOAIS_ADMISSAO,
  todosDocumentosAnexados,
  documentoEhMultiplo,
} from "../../lib/admissaoApi";
import { anexarDocumentoChecklist, removerDocumentoChecklist } from "../../lib/documentosChecklistApi";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

const CHECKLIST_LABELS = {
  dadosPessoais: "Dados pessoais",
  documentos: "Upload de documentos",
  exameAdmissional: "Exame admissional",
  assinaturaContrato: "Assinatura eletrônica do contrato",
  integracaoDominio: "Envio ao Domínio Sistemas",
};

// Etapas cujo check só pode ser marcado automaticamente ao anexar documento —
// clicar nelas abre o modal de anexos em vez de alternar o check direto.
const ETAPAS_COM_ANEXO = new Set(["documentos"]);

// Essas etapas só liberam o check depois que "Upload de documentos" estiver concluído.
const ETAPAS_APOS_DOCUMENTOS = new Set(["exameAdmissional", "assinaturaContrato", "integracaoDominio"]);

function getStatus(pct) {
  if (pct === 100) return { label: "Concluída", badgeClass: "badge-success" };
  if (pct >= 50) return { label: "Em andamento", badgeClass: "badge-info" };
  return { label: "Iniciando", badgeClass: "badge-warning" };
}

export default function AdmissaoDigital() {
  const navigate = useNavigate();
  const [admissoes, setAdmissoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [admissaoParaExcluirId, setAdmissaoParaExcluirId] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");
  const [admissaoDocumentosId, setAdmissaoDocumentosId] = useState(null);

  const admissaoParaExcluir = admissoes.find((a) => a.id === admissaoParaExcluirId) ?? null;
  const admissaoDocumentos = admissoes.find((a) => a.id === admissaoDocumentosId) ?? null;

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
    if (ETAPAS_COM_ANEXO.has(chave)) {
      setAdmissaoDocumentosId(admissao.id);
      return;
    }
    if (ETAPAS_APOS_DOCUMENTOS.has(chave) && !admissao.checklist.documentos) {
      setErro('Conclua o "Upload de documentos" antes de marcar esta etapa.');
      setAdmissaoDocumentosId(admissao.id);
      return;
    }
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

  async function handleAnexarDocumento(admissao, docChave, arquivo) {
    const checklistAnterior = admissao.checklist;
    const anexo = await anexarDocumentoChecklist(`admissao/${admissao.id}`, arquivo);
    const anexoAnterior = checklistAnterior.documentosAnexos[docChave];
    const novoValor = documentoEhMultiplo(docChave) ? [...(anexoAnterior || []), anexo] : anexo;
    const documentosAnexos = { ...checklistAnterior.documentosAnexos, [docChave]: novoValor };
    const checklist = { ...checklistAnterior, documentosAnexos, documentos: todosDocumentosAnexados(documentosAnexos) };
    setAdmissoes((atual) => atual.map((a) => (a.id === admissao.id ? { ...a, checklist } : a)));
    try {
      await atualizarChecklistAdmissao(admissao.id, checklist);
    } catch (e) {
      setAdmissoes((atual) => atual.map((a) => (a.id === admissao.id ? { ...a, checklist: checklistAnterior } : a)));
      throw e;
    }
  }

  // `indice` só existe pra documentos `multiplo` (ex.: "dependente") — indica
  // qual arquivo da lista remover; nos demais, remove o anexo único.
  async function handleRemoverDocumento(admissao, docChave, indice) {
    const checklistAnterior = admissao.checklist;
    const anexoAtual = checklistAnterior.documentosAnexos[docChave];
    const multiplo = documentoEhMultiplo(docChave);
    const anexoRemovido = multiplo ? anexoAtual?.[indice] : anexoAtual;
    const novoValor = multiplo ? (anexoAtual || []).filter((_, i) => i !== indice) : null;
    const documentosAnexos = { ...checklistAnterior.documentosAnexos, [docChave]: novoValor };
    const checklist = { ...checklistAnterior, documentosAnexos, documentos: todosDocumentosAnexados(documentosAnexos) };
    setAdmissoes((atual) => atual.map((a) => (a.id === admissao.id ? { ...a, checklist } : a)));
    try {
      await removerDocumentoChecklist(anexoRemovido?.path);
      await atualizarChecklistAdmissao(admissao.id, checklist);
    } catch (e) {
      setAdmissoes((atual) => atual.map((a) => (a.id === admissao.id ? { ...a, checklist: checklistAnterior } : a)));
      throw e;
    }
  }

  function handleCadastroOficial(admissao) {
    navigate("/colaboradores", {
      state: {
        prefillColaborador: {
          nome: admissao.nome,
          cargo: admissao.cargo,
          filial: admissao.filial,
          admissao: admissao.dataPrevista,
          // Documentos já anexados durante a Admissão Digital seguem com o
          // colaborador — caem direto na aba Documentos, sem precisar reanexar.
          documentos: { anexos: admissao.checklist.documentosAnexos, extras: [] },
        },
      },
    });
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
            const etapas = Object.keys(CHECKLIST_LABELS).map((chave) => [chave, adm.checklist[chave]]);
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
                    <CalendarClock size={13} /> Previsão: {formatDate(adm.dataPrevista)}
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
                    const comAnexo = ETAPAS_COM_ANEXO.has(key);
                    const anexados = comAnexo
                      ? DOCUMENTOS_PESSOAIS_ADMISSAO.filter((doc) =>
                          doc.multiplo
                            ? (adm.checklist.documentosAnexos[doc.chave]?.length ?? 0) > 0
                            : adm.checklist.documentosAnexos[doc.chave]
                        ).length
                      : null;
                    const bloqueada = ETAPAS_APOS_DOCUMENTOS.has(key) && !adm.checklist.documentos;
                    return (
                      <div
                        key={key}
                        className={`admissao-step ${done ? "done" : ""}`}
                        style={{ cursor: bloqueada ? "not-allowed" : "pointer", opacity: bloqueada ? 0.5 : 1 }}
                        title={bloqueada ? 'Conclua o "Upload de documentos" antes' : undefined}
                        onClick={() => handleToggleEtapa(adm, key)}
                      >
                        <span className="admissao-step-icon">
                          {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        </span>
                        <span className="admissao-step-label">
                          {CHECKLIST_LABELS[key]}
                          {comAnexo && !done && (
                            <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
                              {" "}
                              · {anexados}/{DOCUMENTOS_PESSOAIS_ADMISSAO.length} anexados
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {pct === 100 && (
                  <div style={{ marginTop: 14, textAlign: "right" }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: "6px 12px", fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6 }}
                      onClick={() => handleCadastroOficial(adm)}
                    >
                      <UserPlus size={14} /> Cadastro oficial
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {admissaoDocumentos && (
        <AnexarDocumentosModal
          titulo={`Documentos pessoais — ${admissaoDocumentos.nome}`}
          documentos={DOCUMENTOS_PESSOAIS_ADMISSAO}
          anexos={admissaoDocumentos.checklist.documentosAnexos}
          onAnexar={(docChave, arquivo) => handleAnexarDocumento(admissaoDocumentos, docChave, arquivo)}
          onRemover={(docChave, indice) => handleRemoverDocumento(admissaoDocumentos, docChave, indice)}
          onFechar={() => setAdmissaoDocumentosId(null)}
        />
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
