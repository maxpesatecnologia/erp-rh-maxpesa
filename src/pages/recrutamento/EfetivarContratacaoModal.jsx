import { useState } from "react";
import { X } from "lucide-react";

export default function EfetivarContratacaoModal({ candidato, onFechar, onConfirmar, salvando = false, erro = "" }) {
  const [cargo, setCargo] = useState(candidato.vaga || "");
  const [filial, setFilial] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onConfirmar({ cargo: cargo.trim(), filial: filial.trim(), dataPrevista });
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Efetivar contratação</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <p className="section-hint" style={{ marginTop: 0 }}>
          {candidato.nome} será enviado(a) para a Admissão Digital com o checklist de contratação zerado.
        </p>

        <form onSubmit={handleSubmit}>
          {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

          <div className="field-group">
            <label>Cargo</label>
            <input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex.: Mecânico de Equipamentos Pesados" />
          </div>

          <div className="field-group">
            <label>Filial</label>
            <input value={filial} onChange={(e) => setFilial(e.target.value)} placeholder="Ex.: Matriz, Filial Norte…" required />
          </div>

          <div className="field-group">
            <label>Data prevista de admissão</label>
            <input type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} required />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={!filial.trim() || !dataPrevista || salvando}>
              {salvando ? "Enviando…" : "Efetivar e enviar para Admissão"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
