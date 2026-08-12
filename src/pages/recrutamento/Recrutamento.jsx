import { useState } from "react";
import SourceTag from "../../components/SourceTag";
import { PIPELINE_STAGES } from "../../data/mock/recrutamento";

export default function Recrutamento() {
  const [stages, setStages] = useState(PIPELINE_STAGES);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStageId, setDragOverStageId] = useState(null);

  function handleDrop(targetStageId) {
    if (!draggingId) return;
    setStages((prev) => {
      let moved = null;
      const withoutCard = prev.map((stage) => {
        const found = stage.candidatos.find((c) => c.id === draggingId);
        if (!found) return stage;
        moved = found;
        return { ...stage, candidatos: stage.candidatos.filter((c) => c.id !== draggingId) };
      });
      if (!moved) return prev;
      return withoutCard.map((stage) =>
        stage.id === targetStageId ? { ...stage, candidatos: [...stage.candidatos, moved] } : stage
      );
    });
    setDraggingId(null);
    setDragOverStageId(null);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Recrutamento & Seleção</h1>
          <div className="page-subtitle">Pipeline Kanban de vagas — banco de currículos, entrevistas e avaliações</div>
        </div>
        <SourceTag path="SharePoint / RH / Recrutamento / Pipeline_Vagas.xlsx + LinkedIn Talent" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)`, alignItems: "start" }}>
        {stages.map((stage) => (
          <div
            className={"card card-pad kanban-column" + (dragOverStageId === stage.id ? " kanban-column-over" : "")}
            key={stage.id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStageId(stage.id);
            }}
            onDragLeave={() => setDragOverStageId((id) => (id === stage.id ? null : id))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(stage.id);
            }}
          >
            <div className="section-title">
              {stage.titulo} <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({stage.candidatos.length})</span>
            </div>
            {stage.candidatos.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Sem candidatos nesta etapa.</div>
            )}
            {stage.candidatos.map((c) => (
              <div
                key={c.id}
                className={"card card-pad kanban-card" + (draggingId === c.id ? " kanban-card-dragging" : "")}
                style={{ marginBottom: 10, boxShadow: "none" }}
                draggable
                onDragStart={() => setDraggingId(c.id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverStageId(null);
                }}
              >
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
