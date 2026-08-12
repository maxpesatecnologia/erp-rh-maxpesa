import SourceTag from "../../components/SourceTag";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { TREINAMENTOS } from "../../data/mock/treinamentos";

export default function Treinamentos() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Treinamentos</h1>
          <div className="page-subtitle">Cursos, certificados, reciclagens de NR e controle de validade</div>
        </div>
        <SourceTag path="SharePoint / RH / Treinamentos / Controle_Treinamentos_NRs.xlsx" />
      </div>

      <div className="card">
        <DataTable
          columns={[
            { key: "colaborador", label: "Colaborador" },
            { key: "curso", label: "Curso" },
            { key: "tipo", label: "Tipo" },
            { key: "cargaHoraria", label: "Carga horária (h)" },
            { key: "conclusao", label: "Conclusão" },
            { key: "validade", label: "Validade" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
          rows={TREINAMENTOS}
        />
      </div>

      <div className="card card-pad" style={{ marginTop: 18, fontSize: 12.5, color: "var(--color-text-muted)" }}>
        🔔 Alertas automáticos: colaboradores com treinamentos "Vencendo" ou "Vencido" são notificados
        e sinalizados no módulo de Gestão de Equipes para bloqueio operacional.
      </div>
    </div>
  );
}
