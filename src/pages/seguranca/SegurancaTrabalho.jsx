import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { DOCUMENTOS_LEGAIS, DDS_REGISTROS, APRS, INSPECOES, NAO_CONFORMIDADES, CATS } from "../../data/mock/seguranca";

// Botão sem funcionalidade — só ilustra o layout enquanto os dados são mock.
function BotaoEditar() {
  return (
    <button className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 12 }} disabled>
      Editar
    </button>
  );
}

export default function SegurancaTrabalho() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Segurança do Trabalho</h1>
          <div className="page-subtitle">PGR, PCMSO, CAT, APR, DDS, inspeções, incidentes e plano de ação</div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="section-title">PGR / PCMSO por filial</div>
        <DataTable
          columns={[
            { key: "documento", label: "Documento" },
            { key: "filial", label: "Filial" },
            { key: "validade", label: "Validade" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "acoes", label: "", render: () => <BotaoEditar /> },
          ]}
          rows={DOCUMENTOS_LEGAIS}
        />
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="section-title">APRs recentes</div>
        <DataTable
          columns={[
            { key: "atividade", label: "Atividade" },
            { key: "equipe", label: "Equipe" },
            { key: "risco", label: "Risco" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "acoes", label: "", render: () => <BotaoEditar /> },
          ]}
          rows={APRS}
        />
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="section-title">DDS realizados</div>
        <DataTable
          columns={[
            { key: "tema", label: "Tema" },
            { key: "equipe", label: "Equipe" },
            { key: "data", label: "Data" },
            { key: "participantes", label: "Participantes" },
            { key: "acoes", label: "", render: () => <BotaoEditar /> },
          ]}
          rows={DDS_REGISTROS}
        />
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="section-title">Inspeções</div>
        <DataTable
          columns={[
            { key: "item", label: "Item" },
            { key: "tipo", label: "Tipo" },
            { key: "data", label: "Data" },
            { key: "resultado", label: "Resultado", render: (r) => <StatusBadge status={r.resultado === "Conforme" ? "Válido" : "Vencido"} /> },
            { key: "acoes", label: "", render: () => <BotaoEditar /> },
          ]}
          rows={INSPECOES}
        />
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="section-title">Não conformidades / Plano de ação</div>
        <DataTable
          columns={[
            { key: "descricao", label: "Descrição" },
            { key: "planoAcao", label: "Plano de ação" },
            { key: "responsavel", label: "Responsável" },
            { key: "prazo", label: "Prazo" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "acoes", label: "", render: () => <BotaoEditar /> },
          ]}
          rows={NAO_CONFORMIDADES}
        />
      </div>

      <div className="card card-pad">
        <div className="section-title">CATs (Comunicação de Acidente de Trabalho)</div>
        <DataTable
          columns={[
            { key: "colaborador", label: "Colaborador" },
            { key: "data", label: "Data" },
            { key: "descricao", label: "Descrição" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "acoes", label: "", render: () => <BotaoEditar /> },
          ]}
          rows={CATS}
        />
      </div>
    </div>
  );
}
