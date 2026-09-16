import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  UserCheck,
  Kanban as KanbanIcon,
  FolderOpen,
  Folder,
  UploadCloud,
  FileText,
  Download,
  Trash2,
  X,
} from "lucide-react";
import { PIPELINE_STAGES } from "../../data/mock/recrutamento";
import { PASTAS_CARGOS } from "../../data/mock/bancoCurriculos";
import { formatDate } from "../../utils/format";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import {
  listarCandidatos,
  criarCandidato as criarCandidatoRemoto,
  moverCandidato as moverCandidatoRemoto,
  atualizarCandidato as atualizarCandidatoRemoto,
  excluirCandidato as excluirCandidatoRemoto,
} from "../../lib/recrutamentoApi";
import { listarAdmissoes, criarAdmissao } from "../../lib/admissaoApi";
import {
  listarPastas,
  criarPasta as criarPastaRemota,
  excluirPasta as excluirPastaRemota,
  importarCurriculos as importarCurriculosRemoto,
  removerCurriculo as removerCurriculoRemoto,
  obterUrlCurriculo,
} from "../../lib/bancoCurriculosApi";
import CandidatoModal from "./CandidatoModal";
import { OPCOES_ORIGEM } from "./origens";
import EfetivarContratacaoModal from "./EfetivarContratacaoModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

const ESTAGIOS = PIPELINE_STAGES.map(({ id, titulo }) => ({ id, titulo }));
const ESTAGIO_INICIAL = ESTAGIOS[0]?.id ?? "recebidos";
const ESTAGIO_APROVACAO = ESTAGIOS[ESTAGIOS.length - 1]?.id;

let proximoIdLocal = 1;

function proximoId(prefixo, lista) {
  const maiorNumero = lista.reduce((max, item) => {
    const numero = Number(String(item.id).replace(/\D/g, ""));
    return Number.isFinite(numero) && numero > max ? numero : max;
  }, 0);
  return `${prefixo}-${maiorNumero + 1}`;
}

export default function Recrutamento() {
  const navigate = useNavigate();
  const [visualizacao, setVisualizacao] = useState("kanban");

  // --- Kanban de vagas ---
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

  // --- Banco de currículos ---
  const [pastas, setPastas] = useState(isSupabaseConfigured ? [] : PASTAS_CARGOS);
  const [carregandoPastas, setCarregandoPastas] = useState(isSupabaseConfigured);
  const [erroCarregamentoPastas, setErroCarregamentoPastas] = useState("");
  const [pastaSelecionadaId, setPastaSelecionadaId] = useState(null);
  const [novaPastaAberta, setNovaPastaAberta] = useState(false);
  const [novoCargo, setNovoCargo] = useState("");
  const [criandoPasta, setCriandoPasta] = useState(false);
  const [erroPasta, setErroPasta] = useState("");
  const [pastaParaExcluir, setPastaParaExcluir] = useState(null);
  const [excluindoPasta, setExcluindoPasta] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");
  const [importando, setImportando] = useState(false);
  const [erroImportacao, setErroImportacao] = useState("");
  const [erroAcaoCv, setErroAcaoCv] = useState("");
  const inputImportRef = useRef(null);

  const pastaSelecionada = pastas.find((p) => p.id === pastaSelecionadaId) ?? null;

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

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    listarPastas()
      .then(setPastas)
      .catch((erro) => setErroCarregamentoPastas(erro.message))
      .finally(() => setCarregandoPastas(false));
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

  function abrirPasta(pasta) {
    setErroImportacao("");
    setErroAcaoCv("");
    setPastaSelecionadaId((atual) => (atual === pasta.id ? null : pasta.id));
  }

  async function criarPasta(e) {
    e.preventDefault();
    const cargo = novoCargo.trim();
    if (!cargo) return;
    setCriandoPasta(true);
    setErroPasta("");
    try {
      if (isSupabaseConfigured) {
        const nova = await criarPastaRemota(cargo);
        setPastas((atual) => [nova, ...atual]);
        setPastaSelecionadaId(nova.id);
      } else {
        const nova = { id: proximoId("cargo", pastas), cargo, curriculos: [] };
        setPastas((atual) => [...atual, nova]);
        setPastaSelecionadaId(nova.id);
      }
      setNovoCargo("");
      setNovaPastaAberta(false);
    } catch (erro) {
      setErroPasta(erro.message || "Erro ao criar pasta.");
    } finally {
      setCriandoPasta(false);
    }
  }

  function pedirExclusaoPasta(pasta) {
    setErroExclusao("");
    setPastaParaExcluir(pasta);
  }

  function fecharModalExclusaoPasta() {
    if (excluindoPasta) return;
    setPastaParaExcluir(null);
    setErroExclusao("");
  }

  async function confirmarExclusaoPasta() {
    const pasta = pastaParaExcluir;
    if (!pasta) return;
    setExcluindoPasta(true);
    setErroExclusao("");
    try {
      if (isSupabaseConfigured) {
        await excluirPastaRemota(pasta.id);
      }
      setPastas((atual) => atual.filter((p) => p.id !== pasta.id));
      setPastaSelecionadaId((atual) => (atual === pasta.id ? null : atual));
      setPastaParaExcluir(null);
    } catch (erro) {
      setErroExclusao(erro.message || "Erro ao excluir pasta.");
    } finally {
      setExcluindoPasta(false);
    }
  }

  async function importarCurriculos(e) {
    const arquivos = Array.from(e.target.files ?? []);
    if (arquivos.length === 0 || !pastaSelecionadaId) return;
    setErroImportacao("");
    setImportando(true);
    try {
      if (isSupabaseConfigured) {
        const novos = await importarCurriculosRemoto(pastaSelecionadaId, arquivos);
        setPastas((atual) =>
          atual.map((p) => (p.id === pastaSelecionadaId ? { ...p, curriculos: [...novos, ...p.curriculos] } : p))
        );
      } else {
        setPastas((atual) =>
          atual.map((p) => {
            if (p.id !== pastaSelecionadaId) return p;
            let proximoNumero = Number(proximoId("cv", p.curriculos).replace(/\D/g, ""));
            const novos = arquivos.map((arquivo) => {
              const cv = {
                id: `cv-${proximoNumero}`,
                nome: arquivo.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
                arquivoNome: arquivo.name,
                enviadoEm: new Date().toISOString().slice(0, 10),
                origem: "Upload manual",
              };
              proximoNumero += 1;
              return cv;
            });
            return { ...p, curriculos: [...novos, ...p.curriculos] };
          })
        );
      }
    } catch (erro) {
      setErroImportacao(erro.message || "Erro ao importar currículos.");
    } finally {
      setImportando(false);
      if (inputImportRef.current) inputImportRef.current.value = "";
    }
  }

  async function removerCurriculo(cv) {
    setErroAcaoCv("");
    try {
      if (isSupabaseConfigured) {
        await removerCurriculoRemoto(cv);
      }
      setPastas((atual) =>
        atual.map((p) =>
          p.id === pastaSelecionadaId ? { ...p, curriculos: p.curriculos.filter((c) => c.id !== cv.id) } : p
        )
      );
    } catch (erro) {
      setErroAcaoCv(erro.message || "Erro ao remover currículo.");
    }
  }

  async function abrirCurriculo(cv) {
    setErroAcaoCv("");
    try {
      const url = await obterUrlCurriculo(cv);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (erro) {
      setErroAcaoCv(erro.message || "Erro ao abrir currículo.");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Recrutamento & Seleção</h1>
          <div className="page-subtitle">Pipeline Kanban de vagas e banco de currículos por cargo</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {visualizacao === "kanban" ? (
            <button
              className="btn btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => setNovoAberto((v) => !v)}
            >
              <Plus size={16} /> Novo candidato
            </button>
          ) : (
            <button
              className="btn btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => setNovaPastaAberta((v) => !v)}
            >
              <Plus size={16} /> Nova pasta de cargo
            </button>
          )}
        </div>
      </div>

      <div className="view-switch">
        <button
          type="button"
          className={"view-switch-btn" + (visualizacao === "kanban" ? " active" : "")}
          onClick={() => setVisualizacao("kanban")}
        >
          <KanbanIcon size={15} /> Kanban
        </button>
        <button
          type="button"
          className={"view-switch-btn" + (visualizacao === "banco" ? " active" : "")}
          onClick={() => setVisualizacao("banco")}
        >
          <FolderOpen size={15} /> Banco de currículos
        </button>
      </div>

      {visualizacao === "kanban" ? (
        <>
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
        </>
      ) : (
        <>
          <div className={`collapse ${novaPastaAberta ? "open" : ""}`}>
            <div className="collapse-inner">
              <div className="collapse-content">
                <form className="card card-pad" style={{ marginBottom: 18 }} onSubmit={criarPasta}>
                  <div className="section-title">Nova pasta de cargo</div>
                  {erroPasta && <div className="login-error" style={{ marginBottom: 12 }}>{erroPasta}</div>}
                  <div className="form-grid">
                    <div className="field-group">
                      <label>Nome do cargo</label>
                      <input
                        value={novoCargo}
                        onChange={(e) => setNovoCargo(e.target.value)}
                        placeholder="Ex.: Mecânico de Equipamentos Pesados"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <button type="submit" className="btn btn-primary" disabled={!novoCargo.trim() || criandoPasta}>
                      {criandoPasta ? "Criando…" : "Criar pasta"}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setNovaPastaAberta(false)} disabled={criandoPasta}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {erroCarregamentoPastas && <div className="login-error" style={{ marginBottom: 14 }}>{erroCarregamentoPastas}</div>}

          {carregandoPastas ? (
            <div className="card card-pad" style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Carregando pastas…
            </div>
          ) : pastas.length === 0 ? (
            <div className="card card-pad" style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Nenhuma pasta de cargo criada ainda. Clique em "Nova pasta de cargo" para começar.
            </div>
          ) : (
            <div className="grid grid-3">
              {pastas.map((pasta) => {
                const ativa = pastaSelecionadaId === pasta.id;
                const Icon = ativa ? FolderOpen : Folder;
                return (
                  <div
                    className={`card card-pad action-card ${ativa ? "action-card-active" : ""}`}
                    key={pasta.id}
                    onClick={() => abrirPasta(pasta)}
                  >
                    <div className="action-icon">
                      <Icon size={22} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{pasta.cargo}</div>
                    <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
                      {pasta.curriculos.length} currículo{pasta.curriculos.length === 1 ? "" : "s"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className={`collapse ${pastaSelecionada ? "open" : ""}`}>
            <div className="collapse-inner">
              {pastaSelecionada && (
                <div className="card card-pad collapse-content" style={{ marginTop: 20 }} key={pastaSelecionada.id}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div className="section-title" style={{ marginBottom: 0 }}>
                      Currículos — {pastaSelecionada.cargo}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button className="btn btn-outline" onClick={() => pedirExclusaoPasta(pastaSelecionada)}>
                        <Trash2 size={14} /> Excluir pasta
                      </button>
                      <button className="icon-btn" aria-label="Fechar pasta" onClick={() => setPastaSelecionadaId(null)}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="section-hint" style={{ marginBottom: 14 }}>
                    {isSupabaseConfigured
                      ? "Os arquivos ficam armazenados no Supabase Storage, vinculados a esta pasta."
                      : "Importação salva apenas nesta sessão (protótipo) — some ao recarregar a página. Configure o Supabase para gravar de verdade (ver README)."}
                  </div>

                  {erroImportacao && <div className="login-error" style={{ marginBottom: 14 }}>{erroImportacao}</div>}
                  {erroAcaoCv && <div className="login-error" style={{ marginBottom: 14 }}>{erroAcaoCv}</div>}

                  <label className="upload-drop" htmlFor="import-curriculos-input">
                    <UploadCloud size={22} />
                    <span>
                      {importando
                        ? "Enviando currículos…"
                        : "Clique para importar currículos (PDF, DOC ou DOCX, até 50 MB cada) — pode selecionar vários de uma vez"}
                    </span>
                    <input
                      id="import-curriculos-input"
                      ref={inputImportRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={importarCurriculos}
                      disabled={importando}
                      style={{ display: "none" }}
                    />
                  </label>

                  <div className="panel-fieldset">
                    <div className="panel-fieldset-title">Currículos nesta pasta</div>
                    {pastaSelecionada.curriculos.length === 0 ? (
                      <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
                        Nenhum currículo importado nesta pasta ainda.
                      </div>
                    ) : (
                      <div className="doc-list">
                        {pastaSelecionada.curriculos.map((cv) => (
                          <div className="doc-row" key={cv.id}>
                            <div className="doc-row-icon">
                              <FileText size={16} />
                            </div>
                            <div className="doc-row-info">
                              <div className="doc-row-title">{cv.nome}</div>
                              <div className="doc-row-meta">
                                {cv.arquivoNome} · {cv.origem} · recebido em {formatDate(cv.enviadoEm)}
                              </div>
                            </div>
                            {isSupabaseConfigured && (
                              <button
                                className="icon-btn"
                                aria-label={`Abrir currículo de ${cv.nome}`}
                                onClick={() => abrirCurriculo(cv)}
                              >
                                <Download size={14} />
                              </button>
                            )}
                            <button
                              className="icon-btn"
                              aria-label={`Remover currículo de ${cv.nome}`}
                              onClick={() => removerCurriculo(cv)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {pastaParaExcluir && (
            <ConfirmDeleteModal
              titulo="Excluir pasta de cargo"
              mensagem={`Tem certeza que deseja excluir a pasta "${pastaParaExcluir.cargo}"? Todos os currículos importados nela (${pastaParaExcluir.curriculos.length}) serão excluídos junto. Essa ação não pode ser desfeita.`}
              confirmando={excluindoPasta}
              erro={erroExclusao}
              onConfirmar={confirmarExclusaoPasta}
              onCancelar={fecharModalExclusaoPasta}
            />
          )}
        </>
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
