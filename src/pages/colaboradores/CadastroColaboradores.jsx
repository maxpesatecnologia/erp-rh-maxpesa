import { useState } from "react";
import SourceTag from "../../components/SourceTag";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { COLABORADORES } from "../../data/mock/colaboradores";

export default function CadastroColaboradores() {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cadastro de Colaboradores</h1>
          <div className="page-subtitle">Cadastro único: dados pessoais, profissionais, histórico e documentos</div>
        </div>
        <SourceTag path="SharePoint / RH / Colaboradores / Cadastro_Colaboradores.xlsx" />
      </div>

      <div className="card">
        <DataTable
          columns={[
            { key: "id", label: "Matrícula" },
            { key: "nome", label: "Nome" },
            { key: "cargo", label: "Cargo" },
            { key: "filial", label: "Filial" },
            { key: "gestor", label: "Gestor" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            {
              key: "acao",
              label: "",
              render: (r) => (
                <button className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => setSelected(r)}>
                  Ver timeline
                </button>
              ),
            },
          ]}
          rows={COLABORADORES}
        />
      </div>

      {selected && (
        <div className="card card-pad" style={{ marginTop: 20 }}>
          <div className="section-title">
            Timeline completa — {selected.nome} ({selected.id})
          </div>
          <div className="grid grid-3" style={{ marginBottom: 18 }}>
            <div>
              <div className="kpi-label">Departamento / Centro de custo</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{selected.departamento} · {selected.centroCusto}</div>
            </div>
            <div>
              <div className="kpi-label">Equipe / Gestor</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{selected.equipe} · {selected.gestor}</div>
            </div>
            <div>
              <div className="kpi-label">Escolaridade / Dependentes</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{selected.escolaridade} · {selected.dependentes} dependente(s)</div>
            </div>
          </div>

          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-date">{selected.admissao}</div>
              <div className="timeline-desc">Admissão como {selected.cargo}.</div>
            </div>
            {selected.cnh && (
              <div className="timeline-item">
                <div className="timeline-date">CNH categoria {selected.cnh.categoria}</div>
                <div className="timeline-desc">Válida até {selected.cnh.validade}.</div>
              </div>
            )}
            {selected.nrs.map((nr) => (
              <div className="timeline-item" key={nr}>
                <div className="timeline-date">NR</div>
                <div className="timeline-desc">{nr} — vínculo ativo no histórico de treinamentos.</div>
              </div>
            ))}
            {selected.certificacoes.map((cert) => (
              <div className="timeline-item" key={cert}>
                <div className="timeline-date">Certificação</div>
                <div className="timeline-desc">{cert}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
