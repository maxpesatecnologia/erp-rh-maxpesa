import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { MEUS_TREINAMENTOS } from "../../../data/mock/portal";
import { formatDate } from "../../../utils/format";

function statusDe(progresso) {
  if (progresso >= 100) return { label: "Concluído", badgeClass: "badge-success" };
  if (progresso > 0) return { label: "Em andamento", badgeClass: "badge-info" };
  return { label: "Pendente", badgeClass: "badge-warning" };
}

export default function TreinamentosPanel() {
  const [treinamentos, setTreinamentos] = useState(MEUS_TREINAMENTOS);

  function avancar(id) {
    setTreinamentos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, progresso: Math.min(100, t.progresso + 20) } : t))
    );
  }

  return (
    <div>
      <div className="section-title">Meus treinamentos</div>
      <div className="section-hint" style={{ marginBottom: 14 }}>Cursos e reciclagens de NR pendentes ou em andamento.</div>

      <div className="doc-list">
        {treinamentos.map((t) => {
          const status = statusDe(t.progresso);
          const concluido = t.progresso >= 100;
          return (
            <div className="training-row" key={t.id}>
              <div className="training-row-top">
                <div className="doc-row-title">{t.curso}</div>
                <span className={`badge ${status.badgeClass}`}>{status.label}</span>
              </div>
              <div className="doc-row-meta" style={{ marginBottom: 8 }}>
                {t.cargaHoraria}h de carga horária{t.validade ? ` · válido até ${formatDate(t.validade)}` : ""}
              </div>
              <div className="admissao-progress">
                <div className="admissao-progress-bar">
                  <div className="admissao-progress-fill" style={{ width: `${t.progresso}%` }} />
                </div>
                <span className="admissao-progress-label">{t.progresso}%</span>
              </div>
              <div className="panel-actions" style={{ marginTop: 10 }}>
                {concluido ? (
                  <span className="inline-hint success">
                    <CheckCircle2 size={14} /> Treinamento concluído
                  </span>
                ) : (
                  <button className="btn btn-outline" onClick={() => avancar(t.id)}>
                    {t.progresso > 0 ? "Continuar treinamento" : "Iniciar treinamento"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
