import SourceTag from "../../components/SourceTag";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { ESTOQUE_EPI, ENTREGAS_EPI } from "../../data/mock/epis";

export default function GestaoEPIs() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gestão de EPIs</h1>
          <div className="page-subtitle">Estoque, entregas, trocas, validades e assinaturas digitais</div>
        </div>
        <SourceTag path="SharePoint / SESMT / EPIs / Estoque_e_Entregas.xlsx" />
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="section-title">Estoque</div>
        <DataTable
          columns={[
            { key: "item", label: "Item" },
            { key: "estoqueAtual", label: "Estoque atual" },
            { key: "estoqueMinimo", label: "Estoque mínimo" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status === "OK" ? "Válido" : r.status === "Baixo" ? "Vencendo" : "Vencido"} /> },
          ]}
          rows={ESTOQUE_EPI}
        />
      </div>

      <div className="card card-pad">
        <div className="section-title">Entregas / assinaturas digitais</div>
        <DataTable
          columns={[
            { key: "colaborador", label: "Colaborador" },
            { key: "item", label: "Item" },
            { key: "validade", label: "Validade" },
            { key: "assinatura", label: "Assinatura", render: (r) => <StatusBadge status={r.assinatura === "Assinado" ? "Válido" : "Pendente"} /> },
          ]}
          rows={ENTREGAS_EPI}
        />
      </div>
    </div>
  );
}
