import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Clock } from "lucide-react";
import { formatDataHora } from "../utils/format";

// Modal genérico de histórico de movimentações — usado tanto pela Admissão
// quanto pelo Desligamento Digital para mostrar quando cada etapa mudou,
// por quem e quando (cada item já vem pronto com a descrição montada por
// quem gerou o histórico, ver criarEntradaHistorico nas telas).
export default function HistoricoEtapasModal({ titulo, historico = [], onFechar }) {
  const ordenado = [...historico].sort((a, b) => new Date(b.data) - new Date(a.data));

  // Trava o scroll da página por trás enquanto o modal estiver aberto.
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
          <h3 style={{ margin: 0 }}>Histórico — {titulo}</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        {ordenado.length === 0 ? (
          <div className="section-hint">Nenhuma movimentação registrada ainda.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 380, overflowY: "auto" }}>
            {ordenado.map((item, i) => (
              <div key={i} className="card card-pad" style={{ boxShadow: "none", padding: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.descricao}</div>
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
                  <Clock size={12} /> {formatDataHora(item.data)} · por {item.usuarioNome || "Usuário desconhecido"}
                </div>
              </div>
            ))}
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
