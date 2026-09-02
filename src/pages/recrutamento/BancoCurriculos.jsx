import { useRef, useState } from "react";
import { Plus, Folder, FolderOpen, UploadCloud, FileText, Trash2, X } from "lucide-react";
import { PASTAS_CARGOS } from "../../data/mock/bancoCurriculos";
import { formatDate } from "../../utils/format";

function proximoId(prefixo, lista) {
  const maiorNumero = lista.reduce((max, item) => {
    const numero = Number(String(item.id).replace(/\D/g, ""));
    return Number.isFinite(numero) && numero > max ? numero : max;
  }, 0);
  return `${prefixo}-${maiorNumero + 1}`;
}

export default function BancoCurriculos() {
  const [pastas, setPastas] = useState(PASTAS_CARGOS);
  const [pastaSelecionadaId, setPastaSelecionadaId] = useState(null);
  const [novaPastaAberta, setNovaPastaAberta] = useState(false);
  const [novoCargo, setNovoCargo] = useState("");
  const inputImportRef = useRef(null);

  const pastaSelecionada = pastas.find((p) => p.id === pastaSelecionadaId) ?? null;

  function abrirPasta(pasta) {
    setPastaSelecionadaId((atual) => (atual === pasta.id ? null : pasta.id));
  }

  function criarPasta(e) {
    e.preventDefault();
    const cargo = novoCargo.trim();
    if (!cargo) return;
    const nova = { id: proximoId("cargo", pastas), cargo, curriculos: [] };
    setPastas((atual) => [...atual, nova]);
    setPastaSelecionadaId(nova.id);
    setNovoCargo("");
    setNovaPastaAberta(false);
  }

  function excluirPasta(pastaId) {
    setPastas((atual) => atual.filter((p) => p.id !== pastaId));
    setPastaSelecionadaId((atual) => (atual === pastaId ? null : atual));
  }

  function importarCurriculos(e) {
    const arquivos = Array.from(e.target.files ?? []);
    if (arquivos.length === 0 || !pastaSelecionadaId) return;
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
    if (inputImportRef.current) inputImportRef.current.value = "";
  }

  function removerCurriculo(cvId) {
    if (!pastaSelecionadaId) return;
    setPastas((atual) =>
      atual.map((p) =>
        p.id === pastaSelecionadaId ? { ...p, curriculos: p.curriculos.filter((c) => c.id !== cvId) } : p
      )
    );
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
                <button type="submit" className="btn btn-primary" disabled={!novoCargo.trim()}>
                  Criar pasta
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setNovaPastaAberta(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {pastas.length === 0 ? (
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
                  <button className="btn btn-outline" onClick={() => excluirPasta(pastaSelecionada.id)}>
                    <Trash2 size={14} /> Excluir pasta
                  </button>
                  <button className="icon-btn" aria-label="Fechar pasta" onClick={() => setPastaSelecionadaId(null)}>
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="section-hint" style={{ marginBottom: 14 }}>
                Importação salva apenas nesta sessão (protótipo) — some ao recarregar a página. Em produção, os
                arquivos são gravados direto na pasta correspondente no SharePoint.
              </div>

              <label className="upload-drop" htmlFor="import-curriculos-input">
                <UploadCloud size={22} />
                <span>Clique para importar currículos (PDF, DOC ou DOCX) — pode selecionar vários de uma vez</span>
                <input
                  id="import-curriculos-input"
                  ref={inputImportRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={importarCurriculos}
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
                        <button
                          className="icon-btn"
                          aria-label={`Remover currículo de ${cv.nome}`}
                          onClick={() => removerCurriculo(cv.id)}
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
    </div>
  );
}