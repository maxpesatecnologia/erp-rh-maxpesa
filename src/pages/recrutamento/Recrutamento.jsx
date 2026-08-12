import SourceTag from "../../components/SourceTag";
import { PIPELINE_STAGES } from "../../data/mock/recrutamento";

export default function Recrutamento() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Recrutamento & Seleção</h1>
          <div className="page-subtitle">Pipeline Kanban de vagas — banco de currículos, entrevistas e avaliações</div>
        </div>
        <SourceTag path="SharePoint / RH / Recrutamento / Pipeline_Vagas.xlsx + LinkedIn Talent" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: `repeat(${PIPELINE_STAGES.length}, 1fr)`, alignItems: "start" }}>
        {PIPELINE_STAGES.map((stage) => (
          <div className="card card-pad" key={stage.id}>
            <div className="section-title">
              {stage.titulo} <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({stage.candidatos.length})</span>
            </div>
            {stage.candidatos.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Sem candidatos nesta etapa.</div>
            )}
            {stage.candidatos.map((c) => (
              <div key={c.id} className="card card-pad" style={{ marginBottom: 10, boxShadow: "none" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{c.nome}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{c.vaga}</div>
                <div style={{ fontSize: 11, marginTop: 6 }}>
                  <span className="badge badge-info">{c.origem}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
