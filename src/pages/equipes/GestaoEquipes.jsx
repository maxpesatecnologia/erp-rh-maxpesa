import { CheckCircle2, XCircle } from "lucide-react";
import { CONTRATOS } from "../../data/mock/equipes";

const REQ_LABELS = {
  aso: "ASO válido",
  cnh: "CNH válida",
  nr: "NR obrigatória",
  integracaoCliente: "Integração do cliente",
  epi: "EPI entregue",
  certificados: "Certificados válidos",
};

export default function GestaoEquipes() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gestão de Equipes</h1>
          <div className="page-subtitle">
            Funcionalidade específica Maxpesa: verificação automática de requisitos por contrato — colaboradores
            com pendência são bloqueados para a operação.
          </div>
        </div>
      </div>

      {CONTRATOS.map((contrato) => (
        <div className="card card-pad" key={contrato.id} style={{ marginBottom: 20 }}>
          <div className="section-title">
            {contrato.id} — {contrato.cliente} · {contrato.local}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginBottom: 14 }}>
            Supervisor: {contrato.supervisor}
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Membro</th>
                  <th>Função</th>
                  {Object.values(REQ_LABELS).map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {contrato.membros.map((m) => (
                  <tr key={m.nome} className={m.bloqueado ? "blocked-row" : ""}>
                    <td>{m.nome}</td>
                    <td>{m.funcao}</td>
                    {Object.keys(REQ_LABELS).map((key) => (
                      <td key={key} style={{ color: m.requisitos[key] ? "var(--color-success)" : "var(--color-danger)" }}>
                        {m.requisitos[key] ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      </td>
                    ))}
                    <td>
                      <span className={`badge ${m.bloqueado ? "badge-danger" : "badge-success"}`}>
                        {m.bloqueado ? "Bloqueado para operação" : "Apto para operação"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
