import { Bell } from "lucide-react";
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
      </div>

      <div className="card card-pad">
        <div className="section-title">Treinamentos e certificações</div>
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

      <div className="card card-pad" style={{ marginTop: 18, fontSize: 12.5, color: "var(--color-text-muted)", display: "flex", alignItems: "flex-start", gap: 8 }}>
        <Bell size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Alertas automáticos: colaboradores com treinamentos "Vencendo" ou "Vencido" são notificados
          e sinalizados no módulo de Gestão de Equipes para bloqueio operacional.
        </span>
      </div>
    </div>
  );
}
