import { useMemo, useState } from "react";
import { X } from "lucide-react";
import SearchableSelect from "../../components/SearchableSelect";
import { calcularDiasPeriodo, calcularSaldoFerias, DIAS_MINIMOS_SOLICITACAO } from "../../lib/feriasCalculo";

export default function SolicitarFeriasModal({ colaboradores, ferias, onFechar, onConfirmar, salvando = false, erro = "" }) {
  const [colaboradorId, setColaboradorId] = useState(colaboradores[0]?.id ?? "");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erroValidacao, setErroValidacao] = useState("");

  const colaborador = colaboradores.find((c) => c.id === colaboradorId);
  const saldo = useMemo(() => (colaborador ? calcularSaldoFerias(colaborador, ferias) : null), [colaborador, ferias]);
  const dias = calcularDiasPeriodo(dataInicio, dataFim);

  function handleSubmit(e) {
    e.preventDefault();
    setErroValidacao("");
    if (!colaborador || !saldo?.temPeriodoDisponivel) {
      setErroValidacao("Este colaborador ainda não completou 12 meses de casa — sem período aquisitivo disponível.");
      return;
    }
    if (!dataInicio || !dataFim || dias <= 0) {
      setErroValidacao("Informe um período de férias válido.");
      return;
    }
    if (dias < DIAS_MINIMOS_SOLICITACAO) {
      setErroValidacao(`O período mínimo é de ${DIAS_MINIMOS_SOLICITACAO} dias corridos.`);
      return;
    }
    if (dias > saldo.diasDisponiveis) {
      setErroValidacao(`Saldo insuficiente: ${colaborador.nome} tem ${saldo.diasDisponiveis} dias disponíveis neste período aquisitivo.`);
      return;
    }
    onConfirmar({
      colaboradorId,
      periodoAquisitivo: saldo.periodoAquisitivo,
      dataInicio,
      dataFim,
      dias,
      observacao: observacao.trim(),
    });
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Solicitar férias</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {(erroValidacao || erro) && <div className="login-error" style={{ marginBottom: 14 }}>{erroValidacao || erro}</div>}

          <div className="field-group">
            <label>Colaborador</label>
            <SearchableSelect
              options={colaboradores.map((c) => ({ value: c.id, label: `${c.nome} · ${c.cargo}` }))}
              value={colaboradorId}
              onChange={setColaboradorId}
              placeholder="Selecione um colaborador"
            />
          </div>

          {colaborador && (
            <div className="section-hint" style={{ marginBottom: 14 }}>
              {saldo?.temPeriodoDisponivel ? (
                <>
                  Saldo disponível: <strong>{saldo.diasDisponiveis} dias</strong> · período aquisitivo{" "}
                  {saldo.periodoAquisitivo.inicio} a {saldo.periodoAquisitivo.fim}
                  {saldo.vencidas && <span style={{ color: "var(--color-danger)" }}> · férias vencidas!</span>}
                </>
              ) : (
                "Ainda não completou 12 meses de casa — sem período aquisitivo disponível."
              )}
            </div>
          )}

          <div className="form-grid">
            <div className="field-group">
              <label>Data de início</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
            </div>
            <div className="field-group">
              <label>Data de término</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required />
            </div>
            <div className="field-group">
              <label>Dias corridos</label>
              <div className="field-static">{dias > 0 ? `${dias} dias` : "—"}</div>
            </div>
          </div>

          <div className="field-group">
            <label>Observação (opcional)</label>
            <input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: preferência de retorno, combinado com o gestor..." />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? "Enviando…" : "Enviar solicitação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
