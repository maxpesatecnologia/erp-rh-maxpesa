import SourceTag from "../../components/SourceTag";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { EXAMES_ASO, VACINAS, CLINICAS } from "../../data/mock/medicina";

export default function MedicinaOcupacional() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Medicina Ocupacional</h1>
          <div className="page-subtitle">ASO, exames, vacinas, clínicas parceiras e alertas de validade</div>
        </div>
        <SourceTag path="SharePoint / SESMT / Medicina_Ocupacional / Controle_ASO.xlsx" />
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <DataTable
          columns={[
            { key: "colaborador", label: "Colaborador" },
            { key: "tipo", label: "Tipo de exame" },
            { key: "clinica", label: "Clínica" },
            { key: "data", label: "Data" },
            { key: "validade", label: "Validade" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
          rows={EXAMES_ASO}
        />
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <div className="section-title">Vacinas</div>
          <DataTable
            columns={[
              { key: "colaborador", label: "Colaborador" },
              { key: "vacina", label: "Vacina" },
              { key: "validade", label: "Validade" },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={VACINAS}
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
