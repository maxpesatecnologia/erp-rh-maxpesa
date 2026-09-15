import { useMemo } from "react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { EXAMES_ASO, VACINAS, CLINICAS } from "../../data/mock/medicina";
import { formatDate, diasAte } from "../../utils/format";

function statusPorValidade(validade) {
  if (!validade) return "Concluído";
  const dias = diasAte(validade);
  if (dias < 0) return "Vencido";
  if (dias <= 60) return "Vencendo";
  return "Válido";
}

function statusDoExame(exame) {
  if (exame.resultado === "Inapto") return "Inapto";
  return statusPorValidade(exame.validade);
}

export default function MedicinaOcupacional() {
  const exames = useMemo(
    () => EXAMES_ASO.map((e) => ({ ...e, status: statusDoExame(e) })),
    []
  );
  const vacinas = useMemo(
    () => VACINAS.map((v) => ({ ...v, status: statusPorValidade(v.validade) })),
    []
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Medicina Ocupacional</h1>
          <div className="page-subtitle">ASO, exames, vacinas, clínicas parceiras e alertas de validade</div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="section-title">Exames ASO</div>
        <DataTable
          columns={[
            { key: "colaborador", label: "Colaborador" },
            { key: "tipo", label: "Tipo de exame" },
            { key: "clinica", label: "Clínica" },
            { key: "data", label: "Data", render: (r) => formatDate(r.data) },
            { key: "validade", label: "Validade", render: (r) => (r.validade ? formatDate(r.validade) : "—") },
            { key: "resultado", label: "Resultado", render: (r) => <StatusBadge status={r.resultado} /> },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
          rows={exames}
        />
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <div className="section-title">Vacinas</div>
          <DataTable
            columns={[
              { key: "colaborador", label: "Colaborador" },
              { key: "vacina", label: "Vacina" },
              { key: "aplicacao", label: "Aplicação", render: (r) => formatDate(r.aplicacao) },
              { key: "validade", label: "Validade", render: (r) => formatDate(r.validade) },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={vacinas}
          />
        </div>
        <div className="card card-pad">
          <div className="section-title">Clínicas parceiras</div>
          <DataTable
            columns={[
              { key: "nome", label: "Clínica" },
              { key: "cidade", label: "Cidade" },
              { key: "contrato", label: "Contrato", render: (r) => <StatusBadge status={r.contrato} /> },
            ]}
            rows={CLINICAS}
          />
        </div>
      </div>
    </div>
  );
}
