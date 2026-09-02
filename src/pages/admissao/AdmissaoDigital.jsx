import { CheckCircle2, Circle, MapPin, CalendarClock } from "lucide-react";
import Avatar from "../../components/Avatar";
import { ADMISSOES } from "../../data/mock/admissao";

const CHECKLIST_LABELS = {
  dadosPessoais: "Dados pessoais",
  documentos: "Upload de documentos",
  exameAdmissional: "Exame admissional",
  assinaturaContrato: "Assinatura eletrônica do contrato",
  integracaoDominio: "Envio ao Domínio Sistemas",
};

function getStatus(pct) {
  if (pct === 100) return { label: "Concluída", badgeClass: "badge-success" };
  if (pct >= 50) return { label: "Em andamento", badgeClass: "badge-info" };
  return { label: "Iniciando", badgeClass: "badge-warning" };
}

export default function AdmissaoDigital() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admissão Digital</h1>
          <div className="page-subtitle">Checklist, upload de documentos, assinatura eletrônica e workflow de aprovação</div>
        </div>
      </div>

      <div className="grid grid-2">
        {ADMISSOES.map((adm) => {
          const etapas = Object.entries(adm.checklist);
          const concluidas = etapas.filter(([, v]) => v).length;
          const pct = Math.round((concluidas / etapas.length) * 100);
          const status = getStatus(pct);
          return (
            <div className="card admissao-card" key={adm.id}>
              <div className="admissao-card-header">
                <Avatar nome={adm.nome} foto={adm.foto} size={44} />
                <div className="admissao-card-title">
                  <div className="admissao-name">{adm.nome}</div>
                  <div className="admissao-cargo">{adm.cargo}</div>
                </div>
                <span className={`badge ${status.badgeClass}`}>{status.label}</span>
              </div>

              <div className="admissao-meta">
                <span>
                  <MapPin size={13} /> {adm.filial}
                </span>
                <span>
                  <CalendarClock size={13} /> Previsão: {adm.dataPrevista}
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
