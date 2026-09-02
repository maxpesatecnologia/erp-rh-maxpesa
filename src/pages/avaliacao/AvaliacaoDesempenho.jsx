import { useState } from "react";
import { X } from "lucide-react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import Avatar from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { AVALIACOES } from "../../data/mock/avaliacao";
import { COLABORADORES } from "../../data/mock/colaboradores";

export default function AvaliacaoDesempenho() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [detalheAberto, setDetalheAberto] = useState(false);

  const colaboradoresVisiveis =
    user?.role === "gestor" ? COLABORADORES.filter((c) => c.gestor === user.nome) : COLABORADORES;

  const avaliacoes = AVALIACOES.filter((a) => colaboradoresVisiveis.some((c) => c.id === a.colaboradorId)).map(
    (a) => ({ ...a, colaborador: COLABORADORES.find((c) => c.id === a.colaboradorId) }),
  );

  function handleVerDetalhes(avaliacao) {
    if (selected?.id === avaliacao.id && detalheAberto) {
      setDetalheAberto(false);
    } else {
      setSelected(avaliacao);
      setDetalheAberto(true);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Avaliação de Desempenho</h1>
          <div className="page-subtitle">Metas, competências e plano de desenvolvimento individual (PDI) por colaborador</div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="section-title">Avaliações do ciclo</div>
        <DataTable
          columns={[
            {
              key: "colaborador",
              label: "Colaborador",
              render: (r) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar nome={r.colaborador?.nome} foto={r.colaborador?.foto} size={28} />
                  <span>{r.colaborador?.nome ?? "—"}</span>
                </div>
              ),
            },
            { key: "cargo", label: "Cargo", render: (r) => r.colaborador?.cargo ?? "—" },
            { key: "ciclo", label: "Ciclo" },
            { key: "nota", label: "Nota geral" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            {
              key: "acao",
              label: "",
              render: (r) => (
                <button className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => handleVerDetalhes(r)}>
                  {selected?.id === r.id && detalheAberto ? "Ocultar detalhes" : "Ver detalhes"}
                </button>
              ),
            },
          ]}
          rows={avaliacoes}
        />
      </div>

      <div className={`collapse ${detalheAberto ? "open" : ""}`}>
        <div className="collapse-inner">
          {selected && (
            <div className="card card-pad collapse-content" style={{ marginTop: 20 }} key={selected.id}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar nome={selected.colaborador?.nome} foto={selected.colaborador?.foto} size={44} />
                  <div className="section-title" style={{ marginBottom: 0 }}>
                    {selected.colaborador?.nome} — {selected.ciclo}
                  </div>
                </div>
                <button className="icon-btn" aria-label="Fechar detalhes" onClick={() => setDetalheAberto(false)}>
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-3">
                <div>
                  <div className="kpi-label">Competências</div>
                  <div className="timeline" style={{ marginTop: 8 }}>
                    {selected.competencias.map((c) => (
                      <div className="timeline-item" key={c.nome}>
                        <div className="timeline-date">{c.nota}</div>
                        <div className="timeline-desc">{c.nome}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="kpi-label">Metas do ciclo</div>
                  <div className="timeline" style={{ marginTop: 8 }}>
                    {selected.metas.map((m) => (
                      <div className="timeline-item" key={m.descricao}>
                        <div className="timeline-date"><StatusBadge status={m.status} /></div>
                        <div className="timeline-desc">{m.descricao}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="kpi-label">Plano de Desenvolvimento (PDI)</div>
                  <div className="timeline" style={{ marginTop: 8 }}>
                    {selected.pdi.map((p) => (
                      <div className="timeline-item" key={p.acao}>
                        <div className="timeline-date"><StatusBadge status={p.status} /></div>
                        <div className="timeline-desc">{p.acao} · prazo {p.prazo}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
