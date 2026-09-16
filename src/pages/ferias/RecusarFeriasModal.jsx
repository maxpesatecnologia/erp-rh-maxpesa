import { useState } from "react";
import { X } from "lucide-react";

export default function RecusarFeriasModal({ colaborador, onFechar, onSalvar, salvando = false, erro = "" }) {
  const [motivo, setMotivo] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!motivo.trim()) return;
    onSalvar(motivo.trim());
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Recusar férias — {colaborador?.nome ?? "Colaborador não encontrado"}</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

          <div className="field-group">
            <label>Motivo da recusa</label>
            <textarea
              rows={4}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: período coincide com pico de operação, combinar nova data com o gestor"
              autoFocus
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onFechar} disabled={salvando}>
              Voltar
            </button>
            <button type="submit" className="btn btn-danger" disabled={salvando || !motivo.trim()}>
              {salvando ? "Salvando…" : "Recusar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
