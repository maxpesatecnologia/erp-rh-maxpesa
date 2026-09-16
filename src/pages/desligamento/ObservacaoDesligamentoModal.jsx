import { useState } from "react";
import { X } from "lucide-react";

export default function ObservacaoDesligamentoModal({ desligamento, colaborador, onFechar, onSalvar, salvando = false, erro = "" }) {
  const [observacao, setObservacao] = useState(desligamento.observacao || "");

  function handleSubmit(e) {
    e.preventDefault();
    onSalvar(observacao.trim());
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Observação — {colaborador?.nome ?? "Colaborador não encontrado"}</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

          <div className="field-group">
            <label>Observação</label>
            <textarea
              rows={4}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: Devolução de equipamentos agendada para 20/09"
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
