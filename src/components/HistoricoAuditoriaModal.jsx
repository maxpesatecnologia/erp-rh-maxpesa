import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Clock, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { formatDataHora } from "../utils/format";
import { listarAuditoria } from "../lib/auditoriaApi";

const ICONE_ACAO = { criacao: PlusCircle, edicao: Pencil, exclusao: Trash2 };
const LABEL_ACAO = { criacao: "Criação", edicao: "Edição", exclusao: "Exclusão" };

// Versão genérica de HistoricoEtapasModal.jsx: em vez de receber um array
// `historico` já pronto (padrão específico de Admissão/Desligamento), busca em
// rh_auditoria pelo par (tabela, registroId) — é o modal aberto pelo clique no
// UltimaEdicaoBadge de qualquer registro do sistema.
export default function HistoricoAuditoriaModal({ titulo, tabela, registroId, onFechar }) {
  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    listarAuditoria({ tabela, registroId })
      .then((dados) => {
        if (ativo) setEntradas(dados);
      })
      .catch((e) => {
        if (ativo) setErro(e.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tabela, registroId]);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, []);

  return createPortal(
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Histórico de alterações — {titulo}</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        {carregando ? (
          <div className="section-hint">Carregando histórico...</div>
        ) : erro ? (
          <div className="section-hint">Não foi possível carregar o histórico: {erro}</div>
        ) : entradas.length === 0 ? (
          <div className="section-hint">Nenhuma alteração registrada ainda para este registro.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto" }}>
            {entradas.map((item) => {
              const Icone = ICONE_ACAO[item.acao] || Pencil;
              const campos = Object.entries(item.alteracoes || {});
              return (
                <div key={item.id} className="card card-pad" style={{ boxShadow: "none", padding: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                    <Icone size={14} /> {LABEL_ACAO[item.acao] || item.acao}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Clock size={12} /> {formatDataHora(item.criadoEm)} · por {item.usuarioNome}
                  </div>
                  {campos.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                      {campos.map(([campo, { antes, depois }]) => (
                        <div key={campo} style={{ fontSize: 12 }}>
                          <strong>{campo}:</strong>{" "}
                          <span style={{ color: "var(--color-text-muted)" }}>{formatValor(antes)}</span>
                          {" → "}
                          <span>{formatValor(depois)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function formatValor(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}
