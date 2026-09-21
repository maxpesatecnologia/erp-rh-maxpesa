import { useEffect, useMemo, useState } from "react";
import { Search, X, PlusCircle, Pencil, Trash2 } from "lucide-react";
import DataTable from "../../components/DataTable";
import { listarAuditoria, MODULOS_AUDITADOS, labelModulo } from "../../lib/auditoriaApi";
import { formatDataHora } from "../../utils/format";

const ICONE_ACAO = { criacao: PlusCircle, edicao: Pencil, exclusao: Trash2 };
const LABEL_ACAO = { criacao: "Criação", edicao: "Edição", exclusao: "Exclusão" };
const VARIANTE_ACAO = { criacao: "success", edicao: "info", exclusao: "danger" };

function formatValor(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

// Tela só para o perfil admin (ver hiddenIfNoAccess em src/config/modules.js e
// a checagem de roles em src/config/modules.js/ProtectedRoute.jsx) — lista
// tudo que foi registrado em rh_auditoria por qualquer módulo do sistema.
export default function LogsAuditoria() {
  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtroTabela, setFiltroTabela] = useState("Todos");
  const [filtroAcao, setFiltroAcao] = useState("Todas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [busca, setBusca] = useState("");
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    setCarregando(true);
    setErro("");
    listarAuditoria({
      tabela: filtroTabela !== "Todos" ? filtroTabela : undefined,
      acao: filtroAcao !== "Todas" ? filtroAcao : undefined,
      dataInicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
      dataFim: dataFim ? new Date(`${dataFim}T23:59:59`).toISOString() : undefined,
    })
      .then(setEntradas)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [filtroTabela, filtroAcao, dataInicio, dataFim]);

  const entradasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return entradas;
    return entradas.filter((e) =>
      [e.usuarioNome, e.usuarioEmail, e.registroLabel, e.registroId].some((campo) =>
        String(campo || "").toLowerCase().includes(termo)
      )
    );
  }, [entradas, busca]);

  function limparFiltros() {
    setFiltroTabela("Todos");
    setFiltroAcao("Todas");
    setDataInicio("");
    setDataFim("");
    setBusca("");
  }

  const filtrosAtivos =
    filtroTabela !== "Todos" || filtroAcao !== "Todas" || dataInicio || dataFim || busca;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Logs de Auditoria</h1>
          <div className="page-subtitle">
            Histórico completo de quem criou, editou ou excluiu cada registro do sistema, e quando — visível
            apenas para administradores.
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <div className="section-title">Todas as alterações</div>
        <div className="filter-row">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por usuário, e-mail ou registro…"
              aria-label="Buscar na auditoria"
            />
            {busca && (
              <button type="button" className="search-clear" onClick={() => setBusca("")} aria-label="Limpar busca">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            className="select-sm"
            value={filtroTabela}
            onChange={(e) => setFiltroTabela(e.target.value)}
            aria-label="Filtrar por módulo"
          >
            <option value="Todos">Todos os módulos</option>
            {MODULOS_AUDITADOS.map((m) => (
              <option key={m.tabela} value={m.tabela}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            className="select-sm"
            value={filtroAcao}
            onChange={(e) => setFiltroAcao(e.target.value)}
            aria-label="Filtrar por ação"
          >
            <option value="Todas">Todas as ações</option>
            <option value="criacao">Criação</option>
            <option value="edicao">Edição</option>
            <option value="exclusao">Exclusão</option>
          </select>
          <input
            type="date"
            className="select-sm"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            aria-label="Data inicial"
          />
          <input
            type="date"
            className="select-sm"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            aria-label="Data final"
          />
          {filtrosAtivos && (
            <button type="button" className="btn btn-outline btn-limpar" onClick={limparFiltros}>
              Limpar filtros
            </button>
          )}
        </div>

        {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}
        {carregando ? (
          <div className="section-hint">Carregando log de auditoria…</div>
        ) : (
          <DataTable
            columns={[
              {
                key: "criadoEm",
                label: "Data/hora",
                render: (e) => formatDataHora(e.criadoEm),
              },
              {
                key: "usuarioNome",
                label: "Usuário",
                render: (e) => (
                  <div>
                    <div>{e.usuarioNome}</div>
                    {e.usuarioEmail && (
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{e.usuarioEmail}</div>
                    )}
                  </div>
                ),
              },
              { key: "tabela", label: "Módulo", render: (e) => labelModulo(e.tabela) },
              {
                key: "registroLabel",
                label: "Registro",
                render: (e) => e.registroLabel || e.registroId,
              },
              {
                key: "acao",
                label: "Ação",
                render: (e) => {
                  const Icone = ICONE_ACAO[e.acao] || Pencil;
                  return (
                    <span className={`badge badge-${VARIANTE_ACAO[e.acao] || "neutral"}`}>
                      <Icone size={12} /> {LABEL_ACAO[e.acao] || e.acao}
                    </span>
                  );
                },
              },
              {
                key: "detalhes",
                label: "",
                render: (e) => (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: "5px 10px", fontSize: 12 }}
                    onClick={() => setDetalhe(e)}
                    disabled={Object.keys(e.alteracoes || {}).length === 0}
                  >
                    Ver detalhes
                  </button>
                ),
              },
            ]}
            rows={entradasFiltradas}
          />
        )}
      </div>

      {detalhe && (
        <div className="modal-backdrop" onClick={() => setDetalhe(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ margin: 0 }}>
                {LABEL_ACAO[detalhe.acao] || detalhe.acao} — {detalhe.registroLabel || detalhe.registroId}
              </h3>
              <button type="button" className="icon-btn" aria-label="Fechar" onClick={() => setDetalhe(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 14 }}>
              {formatDataHora(detalhe.criadoEm)} · por {detalhe.usuarioNome}
              {detalhe.usuarioRole ? ` (${detalhe.usuarioRole})` : ""} · módulo {labelModulo(detalhe.tabela)}
            </div>
            {Object.keys(detalhe.alteracoes || {}).length === 0 ? (
              <div className="section-hint">Nenhum campo com diferença registrada para esta entrada.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 380, overflowY: "auto" }}>
                {Object.entries(detalhe.alteracoes).map(([campo, { antes, depois }]) => (
                  <div key={campo} className="card card-pad" style={{ boxShadow: "none", padding: 10, fontSize: 12 }}>
                    <strong>{campo}</strong>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ color: "var(--color-text-muted)" }}>{formatValor(antes)}</span> {" → "}
                      <span>{formatValor(depois)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setDetalhe(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
