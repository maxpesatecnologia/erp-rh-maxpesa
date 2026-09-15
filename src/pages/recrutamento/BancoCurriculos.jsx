import { useEffect, useRef, useState } from "react";
import { Plus, Folder, FolderOpen, UploadCloud, FileText, Download, Trash2, X } from "lucide-react";
import { PASTAS_CARGOS } from "../../data/mock/bancoCurriculos";
import { formatDate } from "../../utils/format";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import {
  listarPastas,
  criarPasta as criarPastaRemota,
  excluirPasta as excluirPastaRemota,
  importarCurriculos as importarCurriculosRemoto,
  removerCurriculo as removerCurriculoRemoto,
  obterUrlCurriculo,
} from "../../lib/bancoCurriculosApi";

function proximoId(prefixo, lista) {
  const maiorNumero = lista.reduce((max, item) => {
    const numero = Number(String(item.id).replace(/\D/g, ""));
    return Number.isFinite(numero) && numero > max ? numero : max;
  }, 0);
  return `${prefixo}-${maiorNumero + 1}`;
}

export default function BancoCurriculos() {
  const [pastas, setPastas] = useState(isSupabaseConfigured ? [] : PASTAS_CARGOS);
  const [carregando, setCarregando] = useState(isSupabaseConfigured);
  const [erroCarregamento, setErroCarregamento] = useState("");
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
    listarPastas()
      .then(setPastas)
      .catch((erro) => setErroCarregamento(erro.message))
      .finally(() => setCarregando(false));
  }, []);

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
          <h1>Banco de Currículos</h1>
          <div className="page-subtitle">Pastas por cargo — organize e importe currículos recebidos para cada vaga</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => setNovaPastaAberta((v) => !v)}
          >
            <Plus size={16} /> Nova pasta de cargo
          </button>
        </div>
      </div>

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

      {erroCarregamento && <div className="login-error" style={{ marginBottom: 14 }}>{erroCarregamento}</div>}

      {carregando ? (
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
    </div>
  );
}
