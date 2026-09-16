import { useState } from "react";
import { X, Paperclip, UploadCloud, Trash2, ExternalLink, Plus, FileX2 } from "lucide-react";
import { obterUrlDocumentoChecklist } from "../lib/documentosChecklistApi";

// Modal genérico para anexar um ou mais documentos de uma etapa de checklist
// (Admissão/Desligamento) ou do repositório por colaborador (aba Documentos)
// — só libera o check da etapa quando todos os itens de `documentos`
// estiverem anexados em `anexos`. `onCriarDocumento`/`onExcluirDocumento` são
// opcionais: só a aba Documentos permite criar documentos extras nomeados
// pelo próprio RH (marcados com `removivel: true`), Admissão/Desligamento
// continuam com a lista fixa de documentos obrigatórios.
export default function AnexarDocumentosModal({
  titulo,
  subtitulo,
  documentos,
  anexos,
  onAnexar,
  onRemover,
  onFechar,
  onCriarDocumento,
  onExcluirDocumento,
}) {
  const [chaveEmAndamento, setChaveEmAndamento] = useState(null);
  const [erro, setErro] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [criando, setCriando] = useState(false);

  const anexados = documentos.filter((doc) =>
    doc.multiplo ? (anexos[doc.chave]?.length ?? 0) > 0 : anexos[doc.chave]
  ).length;

  async function handleArquivo(chave, arquivo) {
    if (!arquivo) return;
    setErro("");
    setChaveEmAndamento(chave);
    try {
      await onAnexar(chave, arquivo);
    } catch (e) {
      setErro(e.message || "Erro ao anexar documento.");
    } finally {
      setChaveEmAndamento(null);
    }
  }

  // `indice` só é usado pra documentos `multiplo` (qual arquivo da lista
  // remover) — nos demais, undefined, e o pai simplesmente zera o anexo único.
  async function handleRemover(chave, indice) {
    setErro("");
    setChaveEmAndamento(indice !== undefined ? `${chave}:${indice}` : chave);
    try {
      await onRemover(chave, indice);
    } catch (e) {
      setErro(e.message || "Erro ao remover documento.");
    } finally {
      setChaveEmAndamento(null);
    }
  }

  async function handleExcluirDocumento(chave) {
    setErro("");
    setChaveEmAndamento(chave);
    try {
      await onExcluirDocumento(chave);
    } catch (e) {
      setErro(e.message || "Erro ao excluir documento.");
    } finally {
      setChaveEmAndamento(null);
    }
  }

  async function handleVisualizar(path) {
    try {
      const url = await obterUrlDocumentoChecklist(path);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setErro(e.message || "Erro ao abrir documento.");
    }
  }

  async function handleCriarDocumento(e) {
    e.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return;
    setErro("");
    setCriando(true);
    try {
      await onCriarDocumento(nome);
      setNovoNome("");
    } catch (e) {
      setErro(e.message || "Erro ao criar documento.");
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div
        className={`modal-card ${documentos.length > 1 ? "modal-card-large" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>{titulo}</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <p className="section-hint" style={{ marginTop: 0, marginBottom: 16 }}>
          {subtitulo || "Anexe todos os documentos abaixo para poder concluir esta etapa."} ({anexados}/{documentos.length} anexados)
        </p>

        {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

        <div className="doc-list">
          {documentos.map((doc) => {
            const inputId = `anexo-input-${doc.chave}`;

            if (doc.multiplo) {
              const lista = anexos[doc.chave] || [];
              const grupoCarregando = chaveEmAndamento === doc.chave;
              return (
                <div className="doc-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }} key={doc.chave}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className={`doc-row-icon ${lista.length > 0 ? "done" : ""}`}>
                      <Paperclip size={16} />
                    </div>
                    <div className="doc-row-info">
                      <div className="doc-row-title">{doc.label}</div>
                      <div className="doc-row-meta">
                        {grupoCarregando ? "Processando…" : `${lista.length} anexado(s)`}
                      </div>
                    </div>
                    <label className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}>
                      <UploadCloud size={14} /> {grupoCarregando ? "Enviando…" : "Anexar outro"}
                      <input
                        id={inputId}
                        type="file"
                        style={{ display: "none" }}
                        disabled={grupoCarregando}
                        onChange={(e) => {
                          const arquivo = e.target.files?.[0];
                          e.target.value = "";
                          handleArquivo(doc.chave, arquivo);
                        }}
                      />
                    </label>
                  </div>
                  {lista.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 46 }}>
                      {lista.map((item, indice) => {
                        const itemCarregando = chaveEmAndamento === `${doc.chave}:${indice}`;
                        return (
                          <div key={indice} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <span className="doc-row-meta" style={{ marginTop: 0 }}>
                              {itemCarregando ? "Removendo…" : item.nome}
                            </span>
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                              {item.path && (
                                <button
                                  type="button"
                                  className="icon-btn"
                                  aria-label={`Visualizar ${item.nome}`}
                                  title="Visualizar"
                                  onClick={() => handleVisualizar(item.path)}
                                  disabled={itemCarregando}
                                >
                                  <ExternalLink size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                className="icon-btn icon-btn-danger"
                                aria-label={`Remover ${item.nome}`}
                                title="Remover anexo"
                                onClick={() => handleRemover(doc.chave, indice)}
                                disabled={itemCarregando}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const anexo = anexos[doc.chave];
            const carregando = chaveEmAndamento === doc.chave;
            return (
              <div className="doc-row" key={doc.chave}>
                <div className={`doc-row-icon ${anexo ? "done" : ""}`}>
                  <Paperclip size={16} />
                </div>
                <div className="doc-row-info">
                  <div className="doc-row-title">{doc.label}</div>
                  <div className="doc-row-meta">
                    {carregando ? "Processando…" : anexo ? anexo.nome : "Nenhum arquivo anexado"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {anexo && anexo.path && (
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Visualizar ${doc.label}`}
                      title="Visualizar"
                      onClick={() => handleVisualizar(anexo.path)}
                      disabled={carregando}
                    >
                      <ExternalLink size={15} />
                    </button>
                  )}
                  {anexo ? (
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      aria-label={`Remover ${doc.label}`}
                      title="Remover anexo"
                      onClick={() => handleRemover(doc.chave)}
                      disabled={carregando}
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <label className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <UploadCloud size={14} /> {carregando ? "Enviando…" : "Anexar"}
                      <input
                        id={inputId}
                        type="file"
                        style={{ display: "none" }}
                        disabled={carregando}
                        onChange={(e) => {
                          const arquivo = e.target.files?.[0];
                          e.target.value = "";
                          handleArquivo(doc.chave, arquivo);
                        }}
                      />
                    </label>
                  )}
                  {doc.removivel && onExcluirDocumento && (
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      aria-label={`Excluir documento ${doc.label}`}
                      title="Excluir este documento"
                      onClick={() => handleExcluirDocumento(doc.chave)}
                      disabled={carregando}
                    >
                      <FileX2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {onCriarDocumento && (
          <form onSubmit={handleCriarDocumento} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            <div className="field-group" style={{ marginBottom: 0 }}>
              <input
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Nome do novo documento (ex: Atestado médico)"
                disabled={criando}
                aria-label="Nome do novo documento"
              />
            </div>
            <button
              type="submit"
              className="btn btn-outline"
              disabled={criando || !novoNome.trim()}
              style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
            >
              <Plus size={14} /> {criando ? "Criando…" : "Criar documento"}
            </button>
          </form>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
