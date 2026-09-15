import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Plus, UserCheck } from "lucide-react";
import { PIPELINE_STAGES } from "../../data/mock/recrutamento";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import {
  listarCandidatos,
  criarCandidato as criarCandidatoRemoto,
  moverCandidato as moverCandidatoRemoto,
  atualizarCandidato as atualizarCandidatoRemoto,
  excluirCandidato as excluirCandidatoRemoto,
} from "../../lib/recrutamentoApi";
import { listarAdmissoes, criarAdmissao } from "../../lib/admissaoApi";
import CandidatoModal from "./CandidatoModal";
import { OPCOES_ORIGEM } from "./origens";
import EfetivarContratacaoModal from "./EfetivarContratacaoModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

const ESTAGIOS = PIPELINE_STAGES.map(({ id, titulo }) => ({ id, titulo }));
const ESTAGIO_INICIAL = ESTAGIOS[0]?.id ?? "recebidos";
const ESTAGIO_APROVACAO = ESTAGIOS[ESTAGIOS.length - 1]?.id;

let proximoIdLocal = 1;

export default function Recrutamento() {
  const navigate = useNavigate();
  const [candidatos, setCandidatos] = useState([]);
  const [carregando, setCarregando] = useState(isSupabaseConfigured);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStageId, setDragOverStageId] = useState(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaVaga, setNovaVaga] = useState("");
  const [novaOrigemSelecionada, setNovaOrigemSelecionada] = useState("");
  const [novaOrigemCustom, setNovaOrigemCustom] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState("");
  const [candidatoAbertoId, setCandidatoAbertoId] = useState(null);
  const [salvandoModal, setSalvandoModal] = useState(false);
  const [erroModal, setErroModal] = useState("");
  const [candidatoEfetivandoId, setCandidatoEfetivandoId] = useState(null);
  const [efetivandoIds, setEfetivandoIds] = useState(() => new Set());
  const [salvandoEfetivacao, setSalvandoEfetivacao] = useState(false);
  const [erroEfetivacao, setErroEfetivacao] = useState("");
  const [candidatoParaExcluirId, setCandidatoParaExcluirId] = useState(null);
  const [excluindoCandidato, setExcluindoCandidato] = useState(false);
  const [erroExclusaoCandidato, setErroExclusaoCandidato] = useState("");

  const candidatoAberto = candidatos.find((c) => c.id === candidatoAbertoId) ?? null;
  const candidatoEfetivando = candidatos.find((c) => c.id === candidatoEfetivandoId) ?? null;
  const candidatoParaExcluir = candidatos.find((c) => c.id === candidatoParaExcluirId) ?? null;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    listarCandidatos()
      .then(setCandidatos)
      .catch((erro) => setErroCarregamento(erro.message))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    listarAdmissoes()
      .then((admissoes) => {
        const idsJaEfetivados = admissoes.map((a) => a.candidatoId).filter(Boolean);
        setEfetivandoIds(new Set(idsJaEfetivados));
      })
      .catch(() => {});
  }, []);

  async function handleConfirmarEfetivacao(dados) {
    if (!candidatoEfetivando) return;
    setSalvandoEfetivacao(true);
    setErroEfetivacao("");
    try {
      await criarAdmissao({
        candidatoId: candidatoEfetivando.id,
        nome: candidatoEfetivando.nome,
        cargo: dados.cargo || candidatoEfetivando.vaga,
        filial: dados.filial,
        dataPrevista: dados.dataPrevista,
      });
      setEfetivandoIds((atual) => new Set(atual).add(candidatoEfetivando.id));
      setCandidatoEfetivandoId(null);
      navigate("/admissao");
    } catch (erro) {
      setErroEfetivacao(erro.message || "Erro ao efetivar contratação.");
    } finally {
      setSalvandoEfetivacao(false);
    }
  }

  async function handleCriarCandidato(e) {
    e.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return;
    const origem = novaOrigemSelecionada === "Outra" ? novaOrigemCustom.trim() : novaOrigemSelecionada;
    setSalvando(true);
    setErroSalvar("");
    try {
      if (isSupabaseConfigured) {
        const candidato = await criarCandidatoRemoto({ nome, vaga: novaVaga.trim(), origem });
        setCandidatos((atual) => [...atual, candidato]);
      } else {
        setCandidatos((atual) => [
          ...atual,
          {
            id: `local-${proximoIdLocal++}`,
            nome,
            vaga: novaVaga.trim(),
            origem: origem || "Cadastro manual",
            estagioId: ESTAGIO_INICIAL,
            faseAtual: "",
          },
        ]);
      }
      setNovoNome("");
      setNovaVaga("");
      setNovaOrigemSelecionada("");
      setNovaOrigemCustom("");
      setNovoAberto(false);
    } catch (erro) {
      setErroSalvar(erro.message || "Erro ao adicionar candidato.");
    } finally {
      setSalvando(false);
    }
  }

  function handleDrop(targetStageId) {
    if (!draggingId) return;
    const candidato = candidatos.find((c) => c.id === draggingId);
    setDraggingId(null);
    setDragOverStageId(null);
    if (!candidato || candidato.estagioId === targetStageId) return;

    const estagioAnterior = candidato.estagioId;
    setCandidatos((atual) => atual.map((c) => (c.id === candidato.id ? { ...c, estagioId: targetStageId } : c)));

    if (isSupabaseConfigured) {
      moverCandidatoRemoto(candidato.id, targetStageId).catch((erro) => {
        setCandidatos((atual) => atual.map((c) => (c.id === candidato.id ? { ...c, estagioId: estagioAnterior } : c)));
        setErroCarregamento(erro.message);
      });
    }
  }

  function fecharModalCandidato() {
    if (salvandoModal) return;
    setCandidatoAbertoId(null);
    setErroModal("");
  }

  async function handleSalvarCandidato(dados) {
    if (!candidatoAberto) return;
    setSalvandoModal(true);
    setErroModal("");
    try {
      if (isSupabaseConfigured) {
        const atualizado = await atualizarCandidatoRemoto(candidatoAberto.id, dados);
        setCandidatos((atual) => atual.map((c) => (c.id === atualizado.id ? atualizado : c)));
      } else {
        setCandidatos((atual) =>
          atual.map((c) => (c.id === candidatoAberto.id ? { ...c, ...dados } : c))
        );
      }
      setCandidatoAbertoId(null);
    } catch (erro) {
      setErroModal(erro.message || "Erro ao salvar candidato.");
    } finally {
      setSalvandoModal(false);
    }
  }

  function pedirExclusaoCandidato(candidato) {
    setCandidatoAbertoId(null);
    setErroExclusaoCandidato("");
    setCandidatoParaExcluirId(candidato.id);
  }

  function fecharModalExclusaoCandidato() {
    if (excluindoCandidato) return;
    setCandidatoParaExcluirId(null);
    setErroExclusaoCandidato("");
  }

  async function confirmarExclusaoCandidato() {
    const candidato = candidatoParaExcluir;
    if (!candidato) return;
    setExcluindoCandidato(true);
    setErroExclusaoCandidato("");
    try {
      if (isSupabaseConfigured) {
        await excluirCandidatoRemoto(candidato.id);
      }
      setCandidatos((atual) => atual.filter((c) => c.id !== candidato.id));
      setCandidatoParaExcluirId(null);
    } catch (erro) {
      setErroExclusaoCandidato(erro.message || "Erro ao excluir candidato.");
    } finally {
      setExcluindoCandidato(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Recrutamento & Seleção</h1>
          <div className="page-subtitle">Pipeline Kanban de vagas — banco de currículos, entrevistas e avaliações</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => setNovoAberto((v) => !v)}
          >
            <Plus size={16} /> Novo candidato
          </button>
          <button
            className="btn btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => navigate("/recrutamento/banco-curriculos")}
          >
            <FolderOpen size={16} /> Banco de currículos
          </button>
        </div>
      </div>

      <div className={`collapse ${novoAberto ? "open" : ""}`}>
        <div className="collapse-inner">
          <div className="collapse-content">
            <form className="card card-pad" style={{ marginBottom: 18 }} onSubmit={handleCriarCandidato}>
              <div className="section-title">Novo candidato</div>
              {erroSalvar && <div className="login-error" style={{ marginBottom: 12 }}>{erroSalvar}</div>}
              <div className="form-grid">
                <div className="field-group">
                  <label>Nome</label>
                  <input
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Nome do candidato"
                    autoFocus
                  />
                </div>
                <div className="field-group">
                  <label>Vaga</label>
                  <input
                    value={novaVaga}
                    onChange={(e) => setNovaVaga(e.target.value)}
                    placeholder="Ex.: Mecânico de Equipamentos Pesados"
                  />
                </div>
                <div className="field-group">
                  <label>Origem</label>
                  <select value={novaOrigemSelecionada} onChange={(e) => setNovaOrigemSelecionada(e.target.value)}>
                    <option value="">Selecione…</option>
                    {OPCOES_ORIGEM.map((opcao) => (
                      <option key={opcao} value={opcao}>
                        {opcao}
                      </option>
                    ))}
                    <option value="Outra">Outra…</option>
                  </select>
                </div>
                {novaOrigemSelecionada === "Outra" && (
                  <div className="field-group">
                    <label>Qual origem?</label>
                    <input
                      value={novaOrigemCustom}
                      onChange={(e) => setNovaOrigemCustom(e.target.value)}
                      placeholder="Ex.: indicação, feira de empregos…"
                    />
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="submit" className="btn btn-primary" disabled={!novoNome.trim() || salvando}>
                  {salvando ? "Adicionando…" : "Adicionar candidato"}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setNovoAberto(false)} disabled={salvando}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {erroCarregamento && <div className="login-error" style={{ marginBottom: 14 }}>{erroCarregamento}</div>}

      {carregando ? (
        <div className="section-hint">Carregando pipeline…</div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: `repeat(${ESTAGIOS.length}, 1fr)`, alignItems: "start" }}>
          {ESTAGIOS.map((stage) => {
            const candidatosDoEstagio = candidatos.filter((c) => c.estagioId === stage.id);
            return (
              <div
                className={"card card-pad kanban-column" + (dragOverStageId === stage.id ? " kanban-column-over" : "")}
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStageId(stage.id);
                }}
                onDragLeave={() => setDragOverStageId((id) => (id === stage.id ? null : id))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(stage.id);
                }}
              >
                <div className="section-title">
                  {stage.titulo}{" "}
                  <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({candidatosDoEstagio.length})</span>
                </div>
                {candidatosDoEstagio.length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Sem candidatos nesta etapa.</div>
                )}
                {candidatosDoEstagio.map((c) => (
                  <div
                    key={c.id}
                    className={"card card-pad kanban-card" + (draggingId === c.id ? " kanban-card-dragging" : "")}
                    style={{ marginBottom: 10, boxShadow: "none" }}
                    draggable
                    onDragStart={() => setDraggingId(c.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverStageId(null);
                    }}
                    onClick={() => setCandidatoAbertoId(c.id)}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.nome}</div>
                    {c.vaga && <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{c.vaga}</div>}
                    {c.origem && (
                      <div style={{ fontSize: 11, marginTop: 6 }}>
                        <span className="badge badge-info">{c.origem}</span>
                      </div>
                    )}
                    <div className={"kanban-card-fase" + (c.faseAtual ? " kanban-card-fase-preenchida" : "")}>
                      {c.faseAtual || "Clique para ver e editar…"}
                    </div>
                    {stage.id === ESTAGIO_APROVACAO && (
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
                        disabled={efetivandoIds.has(c.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCandidatoEfetivandoId(c.id);
                          setErroEfetivacao("");
                        }}
                      >
                        <UserCheck size={13} />
                        {efetivandoIds.has(c.id) ? "Enviado à Admissão" : "Efetivar contratação"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {candidatoAberto && (
        <CandidatoModal
          candidato={candidatoAberto}
          onFechar={fecharModalCandidato}
          onSalvar={handleSalvarCandidato}
          onExcluir={pedirExclusaoCandidato}
          salvando={salvandoModal}
          erro={erroModal}
        />
      )}

      {candidatoParaExcluir && (
        <ConfirmDeleteModal
          titulo="Excluir candidato"
          mensagem={`Tem certeza que deseja excluir "${candidatoParaExcluir.nome}" do pipeline? Essa ação não pode ser desfeita.`}
          confirmando={excluindoCandidato}
          erro={erroExclusaoCandidato}
          onConfirmar={confirmarExclusaoCandidato}
          onCancelar={fecharModalExclusaoCandidato}
        />
      )}

      {candidatoEfetivando && (
        <EfetivarContratacaoModal
          candidato={candidatoEfetivando}
          onFechar={() => {
            if (salvandoEfetivacao) return;
            setCandidatoEfetivandoId(null);
          }}
          onConfirmar={handleConfirmarEfetivacao}
          salvando={salvandoEfetivacao}
          erro={erroEfetivacao}
        />
      )}
    </div>
  );
}
