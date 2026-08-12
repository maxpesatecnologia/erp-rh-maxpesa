import SourceTag from "../../components/SourceTag";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { OPERADORES } from "../../data/mock/operadores";

export default function OperadoresEquipamentos() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Operadores de Equipamentos</h1>
          <div className="page-subtitle">Diferencial Maxpesa — passaporte operacional completo de cada operador</div>
        </div>
        <SourceTag path="SharePoint / Operacional / Operadores / Cadastro_Operadores.xlsx" />
      </div>

      <div className="card">
        <DataTable
          columns={[
            { key: "nome", label: "Operador" },
            { key: "categoriaOperacional", label: "Categoria" },
            { key: "equipamentosHabilitados", label: "Equipamentos habilitados", render: (r) => r.equipamentosHabilitados.join(", ") },
            { key: "capacidadeMaxima", label: "Capacidade máx." },
            { key: "horasExperiencia", label: "Horas de experiência" },
            { key: "aptidaoMedica", label: "Aptidão médica", render: (r) => <StatusBadge status={r.aptidaoMedica} /> },
            { key: "avaliacaoMedia", label: "Avaliação" },
            { key: "clientesHabilitados", label: "Clientes habilitados", render: (r) => r.clientesHabilitados.join(", ") },
            { key: "disponibilidade", label: "Disponibilidade", render: (r) => <StatusBadge status={r.disponibilidade} /> },
          ]}
          rows={OPERADORES}
          rowKey="id"
        />
      </div>
    </div>
  );
}
