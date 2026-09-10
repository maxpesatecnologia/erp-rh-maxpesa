import { useEffect, useState } from "react";
import { Plus, Upload, X } from "lucide-react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import Avatar from "../../components/Avatar";
import NovoColaboradorForm from "./NovoColaboradorForm";
import ImportarColaboradoresForm from "./ImportarColaboradoresForm";
import { COLABORADORES } from "../../data/mock/colaboradores";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import {
  listarColaboradores,
  criarColaborador as criarColaboradorRemoto,
  importarColaboradores as importarColaboradoresRemoto,
} from "../../lib/colaboradoresApi";

function proximaMatricula(lista) {
  const maiorNumero = lista.reduce((max, c) => {
    const numero = Number(String(c.id).replace(/\D/g, ""));
    return Number.isFinite(numero) && numero > max ? numero : max;
  }, 1000);
  return `C-${maiorNumero + 1}`;
}

// Transforma os dados brutos de um formulário (manual ou importado) no objeto
// final de colaborador — reaproveitado tanto pelo cadastro único quanto pela
// importação em massa.
function criarColaborador(novo, id) {
  return {
    ...novo,
    id,
    status: "Ativo",
    cnh: novo.cnhCategoria ? { categoria: novo.cnhCategoria, validade: novo.cnhValidade } : null,
    nrs: novo.nrs ? novo.nrs.split(",").map((s) => s.trim()).filter(Boolean) : [],
    certificacoes: novo.certificacoes ? novo.certificacoes.split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
}

export default function CadastroColaboradores() {
  const [colaboradores, setColaboradores] = useState(isSupabaseConfigured ? [] : COLABORADORES);
  const [carregando, setCarregando] = useState(isSupabaseConfigured);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [selected, setSelected] = useState(null);
  const [timelineAberta, setTimelineAberta] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const [formVisitado, setFormVisitado] = useState(false);
  const [importAberto, setImportAberto] = useState(false);
  const [importVisitado, setImportVisitado] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    listarColaboradores()
      .then(setColaboradores)
      .catch((erro) => setErroCarregamento(erro.message))
      .finally(() => setCarregando(false));
  }, []);

  function handleVerTimeline(colaborador) {
    if (selected?.id === colaborador.id && timelineAberta) {
      setTimelineAberta(false);
    } else {
      setSelected(colaborador);
      setTimelineAberta(true);
    }
  }

  async function handleCriar(novo) {
    if (isSupabaseConfigured) {
      const colaborador = await criarColaboradorRemoto(novo);
      setColaboradores((atual) => [colaborador, ...atual]);
      setFormAberto(false);
      return;
    }
    const colaborador = criarColaborador(novo, proximaMatricula(colaboradores));
    setColaboradores((atual) => [colaborador, ...atual]);
    setFormAberto(false);
  }

  async function handleImportarEmMassa(linhas) {
    if (isSupabaseConfigured) {
      const novos = await importarColaboradoresRemoto(linhas);
      setColaboradores((atual) => [...novos, ...atual]);
      setImportAberto(false);
      return;
    }
    setColaboradores((atual) => {
      let proximoNumero = Number(proximaMatricula(atual).replace(/\D/g, ""));
      const novos = linhas.map((dados) => {
        const colaborador = criarColaborador(dados, `C-${proximoNumero}`);
        proximoNumero += 1;
        return colaborador;
      });
      return [...novos, ...atual];
    });
    setImportAberto(false);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cadastro de Colaboradores</h1>
          <div className="page-subtitle">Cadastro único: dados pessoais, profissionais, histórico e documentos</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="btn btn-outline"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => {
              setImportVisitado(true);
              setImportAberto((v) => !v);
            }}
          >
            <Upload size={16} /> Importar colaboradores
          </button>
          <button
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => {
              setFormVisitado(true);
              setFormAberto((v) => !v);
            }}
          >
            <Plus size={16} /> Novo colaborador
          </button>
        </div>
      </div>

      <div className={`collapse ${importAberto ? "open" : ""}`}>
        <div className="collapse-inner">
          {importVisitado && (
            <div className="collapse-content">
              <ImportarColaboradoresForm onCancelar={() => setImportAberto(false)} onImportar={handleImportarEmMassa} />
            </div>
          )}
        </div>
      </div>

      <div className={`collapse ${formAberto ? "open" : ""}`}>
        <div className="collapse-inner">
          {formVisitado && (
            <div className="collapse-content">
              <NovoColaboradorForm onCancelar={() => setFormAberto(false)} onCriar={handleCriar} />
            </div>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <div className="section-title">Colaboradores</div>
        {erroCarregamento && <div className="login-error" style={{ marginBottom: 14 }}>{erroCarregamento}</div>}
        {carregando ? (
          <div className="section-hint">Carregando colaboradores…</div>
        ) : (
        <DataTable
          columns={[
            { key: "id", label: "Matrícula" },
            {
              key: "nome",
              label: "Nome",
              render: (r) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar nome={r.nome} foto={r.foto} size={28} />
                  <span>{r.nome}</span>
                </div>
              ),
            },
            { key: "codigoDominio", label: "Código Domínio", render: (r) => r.codigoDominio || "—" },
            { key: "cargo", label: "Cargo" },
            { key: "filial", label: "Filial" },
            { key: "gestor", label: "Gestor" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            {
              key: "acao",
              label: "",
              render: (r) => (
                <button className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => handleVerTimeline(r)}>
                  {selected?.id === r.id && timelineAberta ? "Ocultar timeline" : "Ver timeline"}
                </button>
              ),
            },
          ]}
          rows={colaboradores}
        />
        )}
      </div>

      <div className={`collapse ${timelineAberta ? "open" : ""}`}>
        <div className="collapse-inner">
          {selected && (
            <div className="card card-pad collapse-content" style={{ marginTop: 20 }} key={selected.id}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar nome={selected.nome} foto={selected.foto} size={44} />
                  <div className="section-title" style={{ marginBottom: 0 }}>
                    Timeline completa — {selected.nome} ({selected.id})
                  </div>
                </div>
                <button
                  className="icon-btn"
                  aria-label="Fechar timeline"
                  onClick={() => setTimelineAberta(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-4" style={{ marginBottom: 18 }}>
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
                <div>
                  <div className="kpi-label">Código Domínio</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{selected.codigoDominio || "—"}</div>
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
      </div>
    </div>
  );
}
