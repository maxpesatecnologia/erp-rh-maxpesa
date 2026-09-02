import { CheckCircle2, Circle, MapPin, CalendarClock } from "lucide-react";
import Avatar from "../../components/Avatar";
import { DESLIGAMENTOS } from "../../data/mock/desligamento";
import { COLABORADORES } from "../../data/mock/colaboradores";

const CHECKLIST_LABELS = {
  entrevistaDesligamento: "Entrevista de desligamento",
  devolucaoEquipamentos: "Devolução de equipamentos e EPIs",
  exameDemissional: "Exame demissional",
  acertoRescisorio: "Acerto rescisório",
  homologacaoSindicato: "Homologação no sindicato",
  baixaDominio: "Baixa no Domínio Sistemas",
};

function getStatus(pct) {
  if (pct === 100) return { label: "Concluído", badgeClass: "badge-success" };
  if (pct >= 50) return { label: "Em andamento", badgeClass: "badge-info" };
  return { label: "Iniciando", badgeClass: "badge-warning" };
}

export default function DesligamentoDigital() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Desligamento Digital</h1>
          <div className="page-subtitle">Checklist de saída, devolução de equipamentos, acerto rescisório e baixa no Domínio</div>
        </div>
      </div>

      <div className="grid grid-2">
        {DESLIGAMENTOS.map((desl) => {
          const colaborador = COLABORADORES.find((c) => c.id === desl.colaboradorId);
          const etapas = Object.entries(desl.checklist);
          const concluidas = etapas.filter(([, v]) => v).length;
          const pct = Math.round((concluidas / etapas.length) * 100);
          const status = getStatus(pct);
          return (
            <div className="card admissao-card" key={desl.id}>
              <div className="admissao-card-header">
                <Avatar nome={colaborador?.nome} foto={colaborador?.foto} size={40} />
                <div className="admissao-card-title">
                  <div className="admissao-name">{colaborador?.nome ?? "Colaborador não encontrado"}</div>
                  <div className="admissao-cargo">{colaborador?.cargo} · {desl.motivo}</div>
                </div>
                <span className={`badge ${status.badgeClass}`}>{status.label}</span>
              </div>

              <div className="admissao-meta">
                <span>
                  <MapPin size={13} /> {colaborador?.filial}
                </span>
                <span>
                  <CalendarClock size={13} /> Desligamento: {desl.dataDesligamento}
                </span>
              </div>

              <div className="admissao-progress">
                <div className="admissao-progress-bar">
                  <div className="admissao-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="admissao-progress-label">
                  {concluidas}/{etapas.length} etapas concluídas · {pct}%
                </span>
              </div>

              <div className="admissao-checklist">
                {etapas.map(([key, done]) => (
                  <div key={key} className={`admissao-step ${done ? "done" : ""}`}>
                    <span className="admissao-step-icon">
                      {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </span>
                    <span className="admissao-step-label">{CHECKLIST_LABELS[key]}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
