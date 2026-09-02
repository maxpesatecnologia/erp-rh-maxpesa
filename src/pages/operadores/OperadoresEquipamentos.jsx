import { Wrench, Gauge, Clock, ShieldCheck, Building2, Star, AlertTriangle } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import Avatar from "../../components/Avatar";
import { OPERADORES } from "../../data/mock/operadores";

function tierClass(categoria) {
  if (categoria === "Sênior") return "tier-senior";
  if (categoria === "Pleno") return "tier-pleno";
  return "tier-junior";
}

function disponibilidadeClass(status) {
  if (status === "Disponível") return "badge-success";
  if (status === "Em operação") return "badge-info";
  if (status === "Bloqueado") return "badge-danger";
  return "badge-neutral";
}

export default function OperadoresEquipamentos() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Operadores de Equipamentos</h1>
          <div className="page-subtitle">Diferencial Maxpesa — passaporte operacional completo de cada operador</div>
        </div>
      </div>

      <div className="grid grid-2">
        {OPERADORES.map((op) => {
          const estrelas = Math.round(op.avaliacaoMedia);
          return (
            <div className="card operador-card" key={op.id}>
              <div className="operador-header">
                <Avatar nome={op.nome} foto={op.foto} size={46} />
                <div className="operador-card-title">
                  <div className="operador-name-row">
                    <span className="operador-name">{op.nome}</span>
                    <span className={`tier-pill ${tierClass(op.categoriaOperacional)}`}>{op.categoriaOperacional}</span>
                  </div>
                  <div className="operador-id">{op.id}</div>
                </div>
                <span className={`badge ${disponibilidadeClass(op.disponibilidade)}`}>{op.disponibilidade}</span>
              </div>

              <div className="operador-section">
                <div className="operador-section-label">
                  <Wrench size={12} /> Equipamentos habilitados
                </div>
                <div className="chip-row">
                  {op.equipamentosHabilitados.map((eq) => (
                    <span className="equip-chip" key={eq}>
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              <div className="operador-stats">
                <div className="operador-stat">
                  <Gauge size={14} />
                  <div>
                    <div className="operador-stat-value">{op.capacidadeMaxima}</div>
                    <div className="operador-stat-label">Capacidade máx.</div>
                  </div>
                </div>
                <div className="operador-stat">
                  <Clock size={14} />
                  <div>
                    <div className="operador-stat-value">{op.horasExperiencia.toLocaleString("pt-BR")} h</div>
                    <div className="operador-stat-label">Experiência</div>
                  </div>
                </div>
                <div className="operador-stat">
                  <ShieldCheck size={14} />
                  <div>
                    <div className="operador-stat-value">
                      <StatusBadge status={op.aptidaoMedica} />
                    </div>
                    <div className="operador-stat-label">Aptidão médica</div>
                  </div>
                </div>
              </div>

              <div className="operador-rating-row">
                <div className="operador-stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={14} className={i <= estrelas ? "star-filled" : "star-empty"} />
                  ))}
                </div>
                <span className="operador-rating-value">{op.avaliacaoMedia.toFixed(1)}</span>

                {(op.penalidades > 0 || op.ocorrencias > 0) && (
                  <span className="operador-flags">
                    {op.penalidades > 0 && (
                      <span className="flag-chip flag-danger">
                        <AlertTriangle size={11} /> {op.penalidades} penalidade{op.penalidades > 1 ? "s" : ""}
                      </span>
                    )}
                    {op.ocorrencias > 0 && (
                      <span className="flag-chip flag-warning">
                        <AlertTriangle size={11} /> {op.ocorrencias} ocorrência{op.ocorrencias > 1 ? "s" : ""}
                      </span>
                    )}
                  </span>
                )}
              </div>

              <div className="operador-section">
                <div className="operador-section-label">
                  <Building2 size={12} /> Clientes habilitados
                </div>
                <div className="chip-row">
                  {op.clientesHabilitados.map((c) => (
                    <span className="client-chip" key={c}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
