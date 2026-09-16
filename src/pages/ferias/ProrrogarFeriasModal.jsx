import { useState } from "react";
import { X } from "lucide-react";
import { calcularDiasPeriodo } from "../../lib/feriasCalculo";
import { formatDate } from "../../utils/format";

export default function ProrrogarFeriasModal({ ferias, colaborador, saldoDisponivel, onFechar, onConfirmar, salvando = false, erro = "" }) {
  const [novaDataFim, setNovaDataFim] = useState(ferias.dataFim);
  const [motivo, setMotivo] = useState("");
  const [erroValidacao, setErroValidacao] = useState("");

  const novosDias = calcularDiasPeriodo(ferias.dataInicio, novaDataFim);
  const diasAdicionais = novosDias - ferias.dias;

  function handleSubmit(e) {
    e.preventDefault();
    setErroValidacao("");
    if (!novaDataFim || novaDataFim <= ferias.dataFim) {
      setErroValidacao("A nova data de término precisa ser depois da data atual de término.");
      return;
    }
    if (!motivo.trim()) {
      setErroValidacao("Informe o motivo da prorrogação.");
      return;
    }
    if (diasAdicionais > saldoDisponivel) {
      setErroValidacao(`Saldo insuficiente: ${colaborador?.nome ?? "colaborador"} tem apenas ${saldoDisponivel} dias disponíveis para prorrogar.`);
      return;
    }
    onConfirmar(novaDataFim, motivo.trim());
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Prorrogar férias — {colaborador?.nome ?? "Colaborador não encontrado"}</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {(erroValidacao || erro) && <div className="login-error" style={{ marginBottom: 14 }}>{erroValidacao || erro}</div>}

          <div className="section-hint" style={{ marginBottom: 14 }}>
            Período atual: {formatDate(ferias.dataInicio)} a {formatDate(ferias.dataFim)} · {ferias.dias} dias
            <br />
            Saldo disponível para prorrogar: <strong>{saldoDisponivel} dias</strong>
          </div>

          <div className="form-grid">
            <div className="field-group">
              <label>Nova data de término</label>
              <input
                type="date"
                value={novaDataFim}
                min={ferias.dataFim}
                onChange={(e) => setNovaDataFim(e.target.value)}
                required
              />
            </div>
            <div className="field-group">
              <label>Dias adicionais</label>
              <div className="field-static">{diasAdicionais > 0 ? `+${diasAdicionais} dias (total ${novosDias})` : "—"}</div>
            </div>
          </div>

          <div className="field-group">
            <label>Motivo da prorrogação</label>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: acordo com o colaborador para estender o período"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? "Salvando…" : "Confirmar prorrogação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
