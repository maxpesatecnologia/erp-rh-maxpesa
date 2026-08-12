import DataTable from "../../../components/DataTable";
import { SALDO_FERIAS } from "../../../data/mock/portal";
import { formatDate } from "../../../utils/format";

export default function SaldoFeriasPanel() {
  const pct = Math.min(100, Math.round((SALDO_FERIAS.diasDisponiveis / 30) * 100));

  return (
    <div>
      <div className="section-title">Saldo de férias</div>
      <div className="section-hint" style={{ marginBottom: 18 }}>Sincronizado com o Domínio Sistemas.</div>

      <div className="saldo-ferias-hero">
        <div className="saldo-ferias-value">{SALDO_FERIAS.diasDisponiveis}</div>
        <div className="saldo-ferias-label">dias disponíveis de 30</div>
        <div className="cell-meter" style={{ marginTop: 10 }}>
          <div className="cell-meter-track" style={{ width: "100%" }}>
            <div className="cell-meter-fill" style={{ width: `${pct}%`, background: "var(--color-info)" }} />
          </div>
        </div>
      </div>

      <div className="form-grid" style={{ marginTop: 18 }}>
        <div className="field-group">
          <label>Período aquisitivo atual</label>
          <div className="field-static">{SALDO_FERIAS.periodoAquisitivo}</div>
        </div>
        <div className="field-group">
          <label>Limite para gozo</label>
          <div className="field-static">{SALDO_FERIAS.limiteParaGozo}</div>
        </div>
      </div>

      <div className="panel-fieldset">
        <div className="panel-fieldset-title">Histórico de períodos</div>
        <DataTable
          columns={[
            { key: "periodo", label: "Período aquisitivo" },
            { key: "diasGozados", label: "Dias gozados" },
            { key: "dataInicio", label: "Início do gozo", render: (row) => formatDate(row.dataInicio) },
          ]}
          rows={SALDO_FERIAS.historico}
          rowKey="periodo"
        />
      </div>
    </div>
  );
}
