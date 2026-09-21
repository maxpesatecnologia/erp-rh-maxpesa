import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, ChevronDown, Users, ShieldCheck, ShieldAlert } from "lucide-react";
import Avatar from "../../components/Avatar";
import StatTile from "../../components/StatTile";
import { listarEpisPorColaborador, epiControleConfigured } from "../../lib/epiControleApi";
import { formatDate, formatDataHora } from "../../utils/format";

export default function GestaoEPIs() {
  const [colaboradores, setColaboradores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [erro, setErro] = useState("");
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState(null);
  const [busca, setBusca] = useState("");
  const [empresa, setEmpresa] = useState("Todos");
  const [expandido, setExpandido] = useState(null);

  async function sincronizar() {
    setSincronizando(true);
    setErro("");
    try {
      const dados = await listarEpisPorColaborador();
      setColaboradores(dados);
      setUltimaSincronizacao(new Date().toISOString());
    } catch (e) {
      setErro(e.message || "Não foi possível sincronizar com o EPI Controle.");
    } finally {
      setCarregando(false);
      setSincronizando(false);
    }
  }

  useEffect(() => {
    sincronizar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empresasDisponiveis = useMemo(
    () => Array.from(new Set(colaboradores.map((c) => c.empresa).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [colaboradores]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let lista = colaboradores;
    if (empresa !== "Todos") lista = lista.filter((c) => c.empresa === empresa);
    if (termo) {
      lista = lista.filter((c) =>
        [c.nome, c.cargo, c.setor].some((campo) => String(campo || "").toLowerCase().includes(termo))
      );
    }
    return lista;
  }, [colaboradores, busca, empresa]);

  const totais = useMemo(
    () => ({
      total: colaboradores.length,
      comEpis: colaboradores.filter((c) => c.epis.length > 0).length,
      semEpis: colaboradores.filter((c) => c.epis.length === 0).length,
    }),
    [colaboradores]
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>EPIs por Colaborador</h1>
          <div className="page-subtitle">
            Visualize quais EPIs cada colaborador possui
            {!epiControleConfigured && " · dados de exemplo, aguardando integração com o EPI Controle"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <button
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={sincronizar}
            disabled={sincronizando}
          >
            <RefreshCw size={15} />
            {sincronizando ? "Atualizando…" : "Atualizar"}
          </button>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>
            {ultimaSincronizacao ? `Última atualização: ${formatDataHora(ultimaSincronizacao)}` : "Ainda não sincronizado"}
          </div>
        </div>
      </div>

      {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <StatTile icon={Users} label="Total de Colaboradores" value={totais.total} />
        <StatTile icon={ShieldCheck} label="Com EPIs" value={totais.comEpis} />
        <StatTile icon={ShieldAlert} label="Sem EPIs" value={totais.semEpis} />
      </div>

      <div className="card card-pad">
        <div className="filter-row">
          <div className="seg-toggle">
            <button type="button" className={empresa === "Todos" ? "active" : ""} onClick={() => setEmpresa("Todos")}>
              Todos
            </button>
            {empresasDisponiveis.map((e) => (
              <button key={e} type="button" className={empresa === e ? "active" : ""} onClick={() => setEmpresa(e)}>
                {e}
              </button>
            ))}
          </div>
          <div className="search-box" style={{ marginBottom: 0 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar colaborador ou setor…"
              aria-label="Buscar colaborador"
            />
          </div>
        </div>

        {carregando ? (
          <div className="section-hint">Carregando colaboradores…</div>
        ) : (
          <div className="grid grid-3">
            {filtrados.map((c) => {
              const aberto = expandido === c.id;
              return (
                <div className="card card-pad" key={c.id}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12, cursor: c.epis.length > 0 ? "pointer" : "default" }}
                    onClick={() => c.epis.length > 0 && setExpandido(aberto ? null : c.id)}
                  >
                    <Avatar nome={c.nome} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.nome}
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                        <span className="badge badge-info">{c.empresa}</span>
                        <span className={`badge ${c.epis.length > 0 ? "badge-danger" : "badge-neutral"}`}>
                          {c.epis.length} EPI{c.epis.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    {c.epis.length > 0 && (
                      <ChevronDown size={16} style={{ transform: aberto ? "rotate(180deg)" : "none", transition: "transform .15s ease", flexShrink: 0 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 10 }}>
                    {c.cargo} · {c.setor}
                  </div>

                  <div className={`collapse ${aberto ? "open" : ""}`}>
                    <div className="collapse-inner">
                      <div className="collapse-content">
                        <ul style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)", fontSize: 12.5, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                          {c.epis.map((epi, i) => (
                            <li key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <span>{epi.nome}</span>
                              <span style={{ color: "var(--color-text-muted)" }}>{formatDate(epi.validade)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtrados.length === 0 && (
              <div className="section-hint" style={{ gridColumn: "1 / -1", justifyContent: "center", padding: 24 }}>
                Nenhum colaborador encontrado.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
