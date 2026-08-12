import DataTable from "../../../components/DataTable";
import { BANCO_DE_HORAS } from "../../../data/mock/portal";
import { formatDate } from "../../../utils/format";

export default function BancoHorasPanel() {
  return (
    <div>
      <div className="section-title">Banco de horas</div>
      <div className="section-hint" style={{ marginBottom: 18 }}>Extrato de horas extras e compensações — sincronizado com o Domínio Sistemas.</div>

      <div className="saldo-ferias-hero">
        <div className="saldo-ferias-value">{BANCO_DE_HORAS.saldoAtual}h</div>
        <div className="saldo-ferias-label">saldo atual</div>
      </div>

      <div className="panel-fieldset">
        <div className="panel-fieldset-title">Extrato</div>
        <DataTable
          columns={[
            { key: "data", label: "Data", render: (row) => formatDate(row.data) },
            {
              key: "tipo",
              label: "Tipo",
              render: (row) => <span className={`badge ${row.tipo === "Crédito" ? "badge-success" : "badge-danger"}`}>{row.tipo}</span>,
            },
            { key: "motivo", label: "Motivo" },
            { key: "horas", label: "Horas", render: (row) => `${row.tipo === "Crédito" ? "+" : "-"}${row.horas}h` },
            { key: "saldoAcumulado", label: "Saldo acumulado", render: (row) => `${row.saldoAcumulado}h` },
          ]}
          rows={BANCO_DE_HORAS.extrato}
          rowKey="data"
        />
      </div>
    </div>
  );
}
