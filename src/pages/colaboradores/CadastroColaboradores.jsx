import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search, Upload, X } from "lucide-react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import Avatar from "../../components/Avatar";
import NovoColaboradorForm from "./NovoColaboradorForm";
import ImportarColaboradoresForm from "./ImportarColaboradoresForm";
import IniciarDesligamentoModal from "./IniciarDesligamentoModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { COLABORADORES } from "../../data/mock/colaboradores";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import {
  listarColaboradores,
  criarColaborador as criarColaboradorRemoto,
  atualizarColaborador as atualizarColaboradorRemoto,
  atualizarStatusColaborador,
  excluirColaborador as excluirColaboradorRemoto,
  excluirTodosColaboradores as excluirTodosColaboradoresRemoto,
  importarColaboradores as importarColaboradoresRemoto,
} from "../../lib/colaboradoresApi";
import { criarDesligamento } from "../../lib/desligamentoApi";
import { formatFilial } from "../../utils/format";

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
    status: novo.status || "Ativo",
    cnh: novo.cnhCategoria || novo.cnhNumero
      ? { numero: novo.cnhNumero, categoria: novo.cnhCategoria, validade: novo.cnhValidade }
      : null,
    nrs: novo.nrs ? novo.nrs.split(",").map((s) => s.trim()).filter(Boolean) : [],
    certificacoes: novo.certificacoes ? novo.certificacoes.split(",").map((s) => s.trim()).filter(Boolean) : [],
    equipamentos: novo.equipamentos ? novo.equipamentos.split(",").map((s) => s.trim()).filter(Boolean) : [],
    // Vem preenchido quando o cadastro nasce do "Cadastro oficial" da Admissão
    // Digital (documentos já anexados por lá); senão, começa vazio na aba Documentos.
    documentos: novo.documentos ?? { anexos: {}, extras: [] },
    dependentesNomes: novo.dependentesNomes ?? [],
  };
}

export default function CadastroColaboradores() {
  const navigate = useNavigate();
  const location = useLocation();
  const [colaboradores, setColaboradores] = useState(isSupabaseConfigured ? [] : COLABORADORES);
  const [carregando, setCarregando] = useState(isSupabaseConfigured);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [selected, setSelected] = useState(null);
  const [timelineAberta, setTimelineAberta] = useState(false);
  const [timelineTop, setTimelineTop] = useState(0);
  const cardRef = useRef(null);
  const [formAberto, setFormAberto] = useState(false);
  const [formVisitado, setFormVisitado] = useState(false);
  const [colaboradorEditando, setColaboradorEditando] = useState(null);
  const [dadosIniciaisForm, setDadosIniciaisForm] = useState(null);
  const [importAberto, setImportAberto] = useState(false);
  const [importVisitado, setImportVisitado] = useState(false);
  const [colaboradorParaExcluir, setColaboradorParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");
  const [colaboradorDesligando, setColaboradorDesligando] = useState(null);
  const [salvandoDesligamento, setSalvandoDesligamento] = useState(false);
  const [erroDesligamento, setErroDesligamento] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroFilial, setFiltroFilial] = useState("Todas");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [ordenarPor, setOrdenarPor] = useState("nome");
  const [confirmarLimparTodos, setConfirmarLimparTodos] = useState(false);
  const [limpandoTodos, setLimpandoTodos] = useState(false);
  const [erroLimparTodos, setErroLimparTodos] = useState("");

  const filiaisDisponiveis = useMemo(
    () => Array.from(new Set(colaboradores.map((c) => c.filial).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [colaboradores]
  );
  const statusDisponiveis = useMemo(
    () => Array.from(new Set(colaboradores.map((c) => c.status).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [colaboradores]
  );

  const CAMPO_ORDENACAO = { nome: "nome", matricula: "id", cargo: "cargo", filial: "filial", status: "status" };

  const colaboradoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let lista = colaboradores;
    if (termo) {
      lista = lista.filter((c) =>
        [c.nome, c.cargo, c.codigoDominio, c.id].some((campo) => String(campo || "").toLowerCase().includes(termo))
      );
    }
    if (filtroFilial !== "Todas") {
      lista = lista.filter((c) => c.filial === filtroFilial);
    }
    if (filtroStatus !== "Todos") {
      lista = lista.filter((c) => c.status === filtroStatus);
    }
    const campo = CAMPO_ORDENACAO[ordenarPor] || "nome";
    return [...lista].sort((a, b) =>
      String(a[campo] || "").localeCompare(String(b[campo] || ""), "pt-BR", { numeric: true })
    );
  }, [colaboradores, busca, filtroFilial, filtroStatus, ordenarPor]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    listarColaboradores()
      .then(setColaboradores)
      .catch((erro) => setErroCarregamento(erro.message))
      .finally(() => setCarregando(false));
  }, []);

  // Chegando da Admissão Digital com "Cadastro oficial" — abre o formulário
  // de novo colaborador já com os dados que a admissão tinha.
  useEffect(() => {
    const prefill = location.state?.prefillColaborador;
    if (!prefill) return;
    setColaboradorEditando(null);
    setDadosIniciaisForm(prefill);
    setFormVisitado(true);
    setFormAberto(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  function handleVerTimeline(colaborador, event) {
    if (selected?.id === colaborador.id && timelineAberta) {
      setTimelineAberta(false);
      return;
    }
    const rowEl = event.currentTarget.closest("tr");
    if (rowEl && cardRef.current) {
      const rowRect = rowEl.getBoundingClientRect();
      const cardRect = cardRef.current.getBoundingClientRect();
      setTimelineTop(rowRect.bottom - cardRect.top + 8);
    }
    setSelected(colaborador);
    setTimelineAberta(true);
  }

  function fecharForm() {
    setFormAberto(false);
    setColaboradorEditando(null);
    setDadosIniciaisForm(null);
  }

  function handleEditar(colaborador) {
    setColaboradorEditando(colaborador);
    setDadosIniciaisForm(null);
    setFormVisitado(true);
    setFormAberto(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSalvar(dados) {
    if (colaboradorEditando) {
      if (isSupabaseConfigured) {
        const atualizado = await atualizarColaboradorRemoto(colaboradorEditando.id, dados);
        setColaboradores((atual) => atual.map((c) => (c.id === atualizado.id ? atualizado : c)));
      } else {
        setColaboradores((atual) =>
          atual.map((c) => (c.id === colaboradorEditando.id ? criarColaborador(dados, colaboradorEditando.id) : c))
        );
      }
      fecharForm();
      return;
    }
    if (isSupabaseConfigured) {
      const colaborador = await criarColaboradorRemoto(dados);
      setColaboradores((atual) => [colaborador, ...atual]);
      fecharForm();
      return;
    }
    const colaborador = criarColaborador(dados, proximaMatricula(colaboradores));
    setColaboradores((atual) => [colaborador, ...atual]);
    fecharForm();
  }

  function handleExcluir(colaborador) {
    setErroExclusao("");
    setColaboradorParaExcluir(colaborador);
  }

  function fecharModalExclusao() {
    if (excluindo) return;
    setColaboradorParaExcluir(null);
    setErroExclusao("");
  }

  async function confirmarExclusao() {
    const colaborador = colaboradorParaExcluir;
    if (!colaborador) return;
    setExcluindo(true);
    setErroExclusao("");
    try {
      if (isSupabaseConfigured) {
        await excluirColaboradorRemoto(colaborador.id);
      }
      setColaboradores((atual) => atual.filter((c) => c.id !== colaborador.id));
      if (selected?.id === colaborador.id) {
        setSelected(null);
        setTimelineAberta(false);
      }
      if (colaboradorEditando?.id === colaborador.id) {
        fecharForm();
      }
      setColaboradorParaExcluir(null);
    } catch (erro) {
      setErroExclusao(erro.message || "Erro ao excluir colaborador.");
    } finally {
      setExcluindo(false);
    }
  }

  function handleDesligar(colaborador) {
    setErroDesligamento("");
    setColaboradorDesligando(colaborador);
  }

  function fecharModalDesligamento() {
    if (salvandoDesligamento) return;
    setColaboradorDesligando(null);
    setErroDesligamento("");
  }

  async function handleConfirmarDesligamento(dados) {
    if (!colaboradorDesligando) return;
    setSalvandoDesligamento(true);
    setErroDesligamento("");
    try {
      await criarDesligamento({
        colaboradorId: colaboradorDesligando.id,
        motivo: dados.motivo,
        dataDesligamento: dados.dataDesligamento,
      });
      if (isSupabaseConfigured) {
        await atualizarStatusColaborador(colaboradorDesligando.id, "Desligado");
      }
      setColaboradores((atual) =>
        atual.map((c) => (c.id === colaboradorDesligando.id ? { ...c, status: "Desligado" } : c))
      );
      setColaboradorDesligando(null);
      navigate("/desligamento");
    } catch (erro) {
      setErroDesligamento(erro.message || "Erro ao iniciar desligamento.");
    } finally {
      setSalvandoDesligamento(false);
    }
  }

  function fecharModalLimparTodos() {
    if (limpandoTodos) return;
    setConfirmarLimparTodos(false);
    setErroLimparTodos("");
  }

  async function handleConfirmarLimparTodos() {
    setLimpandoTodos(true);
    setErroLimparTodos("");
    try {
      if (isSupabaseConfigured) {
        await excluirTodosColaboradoresRemoto();
      }
      setColaboradores([]);
      setSelected(null);
      setTimelineAberta(false);
      setConfirmarLimparTodos(false);
    } catch (erro) {
      setErroLimparTodos(erro.message || "Erro ao limpar colaboradores.");
    } finally {
      setLimpandoTodos(false);
    }
  }

  // Colaboradores importados já com "dataDemissao" preenchida (ver
  // ImportarColaboradoresForm) entram com status "Desligado" e precisam do
  // registro correspondente em Desligamento Digital — mesmo par (status +
  // desligamento) que o botão "Desligar" manual cria (ver handleConfirmarDesligamento).
  async function criarDesligamentosDaImportacao(novosColaboradores, linhas) {
    await Promise.all(
      novosColaboradores.map((colaborador, i) => {
        const dataDemissao = linhas[i]?.dataDemissao;
        if (!dataDemissao) return null;
        return criarDesligamento({ colaboradorId: colaborador.id, dataDesligamento: dataDemissao }).catch(() => {});
      })
    );
  }

  async function handleImportarEmMassa(linhas) {
    if (isSupabaseConfigured) {
      const novos = await importarColaboradoresRemoto(linhas);
      await criarDesligamentosDaImportacao(novos, linhas);
      setColaboradores((atual) => [...novos, ...atual]);
      setImportAberto(false);
      return;
    }
    const novos = [];
    setColaboradores((atual) => {
      let proximoNumero = Number(proximaMatricula(atual).replace(/\D/g, ""));
      linhas.forEach((dados) => {
        novos.push(criarColaborador(dados, `C-${proximoNumero}`));
        proximoNumero += 1;
      });
      return [...novos, ...atual];
    });
    await criarDesligamentosDaImportacao(novos, linhas);
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
              setColaboradorEditando(null);
              setDadosIniciaisForm(null);
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
              <ImportarColaboradoresForm
                onCancelar={() => setImportAberto(false)}
                onImportar={handleImportarEmMassa}
                totalColaboradores={colaboradores.length}
                onLimparTodos={() => setConfirmarLimparTodos(true)}
              />
            </div>
          )}
        </div>
      </div>

      <div className={`collapse ${formAberto ? "open" : ""}`}>
        <div className="collapse-inner">
          {formVisitado && (
            <div className="collapse-content">
              <NovoColaboradorForm
                key={colaboradorEditando?.id ?? (dadosIniciaisForm ? "novo-prefill" : "novo")}
                colaborador={colaboradorEditando}
                dadosIniciais={dadosIniciaisForm}
                onCancelar={fecharForm}
                onSalvar={handleSalvar}
              />
            </div>
          )}
        </div>
      </div>

      <div className="card card-pad" style={{ position: "relative" }} ref={cardRef}>
        <div className="section-title">Colaboradores</div>
        <div className="filter-row">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, cargo, código ou matrícula…"
              aria-label="Buscar colaborador"
            />
            {busca && (
              <button type="button" className="search-clear" onClick={() => setBusca("")} aria-label="Limpar busca">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            className="select-sm"
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value)}
            aria-label="Ordenar por"
          >
            <option value="nome">Ordenar por: Nome</option>
            <option value="matricula">Ordenar por: Matrícula</option>
            <option value="cargo">Ordenar por: Cargo</option>
            <option value="filial">Ordenar por: Filial</option>
            <option value="status">Ordenar por: Status</option>
          </select>
          <select
            className="select-sm"
            value={filtroFilial}
            onChange={(e) => setFiltroFilial(e.target.value)}
            aria-label="Filtrar por filial"
          >
            <option value="Todas">Todas as filiais</option>
            {filiaisDisponiveis.map((f) => (
              <option key={f} value={f}>
                {formatFilial(f)}
              </option>
            ))}
          </select>
          <select
            className="select-sm"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            aria-label="Filtrar por status"
          >
            <option value="Todos">Todos os status</option>
            {statusDisponiveis.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {(busca || filtroFilial !== "Todas" || filtroStatus !== "Todos" || ordenarPor !== "nome") && (
            <button
              type="button"
              className="btn btn-outline btn-limpar"
              onClick={() => {
                setBusca("");
                setFiltroFilial("Todas");
                setFiltroStatus("Todos");
                setOrdenarPor("nome");
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
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
            { key: "filial", label: "Filial", render: (r) => formatFilial(r.filial) },
            { key: "gestor", label: "Gestor" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            {
              key: "acao",
              label: "",
              render: (r) => (
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => handleEditar(r)}>
                    Editar
                  </button>
                  <button className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 12 }} onClick={(e) => handleVerTimeline(r, e)}>
                    {selected?.id === r.id && timelineAberta ? "Ocultar timeline" : "Ver timeline"}
                  </button>
                  {r.status !== "Desligado" && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: "5px 10px", fontSize: 12 }}
                      onClick={() => handleDesligar(r)}
                    >
                      Desligar
                    </button>
                  )}
                  <button
                    className="btn btn-outline"
                    style={{ padding: "5px 10px", fontSize: 12, color: "var(--color-danger)" }}
                    onClick={() => handleExcluir(r)}
                  >
                    Excluir
                  </button>
                </div>
              ),
            },
          ]}
          rows={colaboradoresFiltrados}
        />
        )}

        {timelineAberta && selected && (
          <div
            className="card card-pad collapse-content timeline-popover"
            style={{ top: timelineTop }}
            key={selected.id}
          >
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
                    <div className="kpi-label">Gestor</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{selected.gestor || "—"}</div>
                  </div>
                  <div>
                    <div className="kpi-label">Dependentes</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      {selected.dependentesNomes?.length > 0
                        ? selected.dependentesNomes.join(", ")
                        : `${selected.dependentes || 0} dependente(s)`}
                    </div>
                  </div>
                  <div>
                    <div className="kpi-label">Código Domínio</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{selected.codigoDominio || "—"}</div>
                  </div>
                  <div>
                    <div className="kpi-label">CPF</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{selected.cpf || "—"}</div>
                  </div>
                  <div>
                    <div className="kpi-label">Celular</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{selected.celular || "—"}</div>
                  </div>
                  <div>
                    <div className="kpi-label">E-mail</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{selected.email || "—"}</div>
                  </div>
                </div>

                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-date">{selected.admissao}</div>
                    <div className="timeline-desc">Admissão como {selected.cargo}.</div>
                  </div>
                  {selected.cnh && (
                    <div className="timeline-item">
                      <div className="timeline-date">CNH {selected.cnh.categoria}{selected.cnh.numero ? ` — nº ${selected.cnh.numero}` : ""}</div>
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
                  {(selected.equipamentos || []).map((eq) => (
                    <div className="timeline-item" key={eq}>
                      <div className="timeline-date">Equipamento</div>
                      <div className="timeline-desc">Habilitado para operar: {eq}.</div>
                    </div>
                  ))}
                </div>
          </div>
        )}
      </div>

      {colaboradorParaExcluir && (
        <ConfirmDeleteModal
          titulo="Excluir colaborador"
          mensagem={`Tem certeza que deseja excluir "${colaboradorParaExcluir.nome}" (${colaboradorParaExcluir.id})? Essa ação não pode ser desfeita.`}
          confirmando={excluindo}
          erro={erroExclusao}
          onConfirmar={confirmarExclusao}
          onCancelar={fecharModalExclusao}
        />
      )}

      {confirmarLimparTodos && (
        <ConfirmDeleteModal
          titulo="Limpar todos os colaboradores"
          mensagem={`Tem certeza que deseja excluir todos os ${colaboradores.length} colaborador(es) cadastrados? Essa ação não pode ser desfeita.`}
          confirmando={limpandoTodos}
          erro={erroLimparTodos}
          textoConfirmar="Limpar tudo"
          textoConfirmando="Limpando…"
          onConfirmar={handleConfirmarLimparTodos}
          onCancelar={fecharModalLimparTodos}
        />
      )}

      {colaboradorDesligando && (
        <IniciarDesligamentoModal
          colaborador={colaboradorDesligando}
          onFechar={fecharModalDesligamento}
          onConfirmar={handleConfirmarDesligamento}
          salvando={salvandoDesligamento}
          erro={erroDesligamento}
        />
      )}
    </div>
  );
}
