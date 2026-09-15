import { useState } from "react";
import { X } from "lucide-react";

const OPCOES_MOTIVO = [
  "Pedido de demissão",
  "Dispensa sem justa causa",
  "Dispensa com justa causa",
  "Término de contrato de experiência",
  "Acordo entre as partes",
  "Aposentadoria",
];

export default function IniciarDesligamentoModal({ colaborador, onFechar, onConfirmar, salvando = false, erro = "" }) {
  const [motivoSelecionado, setMotivoSelecionado] = useState(OPCOES_MOTIVO[0]);
  const [motivoCustom, setMotivoCustom] = useState("");
  const [dataDesligamento, setDataDesligamento] = useState("");

  const motivoValido = motivoSelecionado === "Outro" ? motivoCustom.trim() : motivoSelecionado;

  function handleSubmit(e) {
    e.preventDefault();
    onConfirmar({ motivo: motivoValido, dataDesligamento });
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Iniciar desligamento</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <p className="section-hint" style={{ marginTop: 0 }}>
          {colaborador.nome} será enviado(a) para o Desligamento Digital com o checklist de saída zerado.
        </p>

        <form onSubmit={handleSubmit}>
          {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

          <div className="field-group">
            <label>Motivo</label>
            <select value={motivoSelecionado} onChange={(e) => setMotivoSelecionado(e.target.value)}>
              {OPCOES_MOTIVO.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
              <option value="Outro">Outro…</option>
            </select>
          </div>

          {motivoSelecionado === "Outro" && (
            <div className="field-group">
              <label>Qual motivo?</label>
              <input
                value={motivoCustom}
                onChange={(e) => setMotivoCustom(e.target.value)}
                placeholder="Descreva o motivo do desligamento"
              />
            </div>
          )}

          <div className="field-group">
            <label>Data de desligamento</label>
            <input type="date" value={dataDesligamento} onChange={(e) => setDataDesligamento(e.target.value)} required />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={!motivoValido || !dataDesligamento || salvando}>
              {salvando ? "Enviando…" : "Confirmar e enviar para Desligamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
