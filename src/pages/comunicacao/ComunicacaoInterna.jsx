import { useEffect, useMemo, useState } from "react";
import { Bell, Cake, CalendarClock, Palmtree, Plus, Search, X } from "lucide-react";
import { COMUNICADOS, ANIVERSARIANTES, FERIAS_EQUIPE } from "../../data/mock/comunicacao";
import { formatDate, formatDiaMes, diasAte, proximoAniversario, diasNoAno } from "../../utils/format";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { listarColaboradores } from "../../lib/colaboradoresApi";
import { listarFerias } from "../../lib/feriasApi";
import { listarComunicados, criarComunicado } from "../../lib/comunicacaoApi";
import { useAuth } from "../../context/AuthContext";
import UltimaEdicaoBadge from "../../components/UltimaEdicaoBadge";

const STATUS_FERIAS_BADGE = {
  "Em andamento": "badge-info",
  "Agendada": "badge-warning",
  "Concluída": "badge-neutral",
};

function statusFerias(inicio, fim) {
  if (diasAte(fim) < 0) return "Concluída";
  if (diasAte(inicio) <= 0) return "Em andamento";
  return "Agendada";
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function rotuloDias(dias) {
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `Em ${dias} dias`;
}

// Rótulo pro aniversariante já passado neste ano (aba "Anteriores") — mesma
// ideia de rotuloDias, mas contando pra trás.
function rotuloDiasPassados(dias) {
  if (dias === 0) return "Hoje";
  if (dias === -1) return "Ontem";
  return `Há ${Math.abs(dias)} dias`;
}

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ComunicacaoInterna() {
  const { user } = useAuth();
  const podePublicar = user?.role === "admin" || user?.role === "rh";

  // Aniversariantes sempre filtrado por um mês específico (nunca "todos de
  // uma vez") — os botões Anteriores/Este mês/Futuros só reposicionam esse
  // mês pro anterior/atual/seguinte ao de hoje.
  const mesAtualNum = new Date().getMonth() + 1;
  const mesAnteriorNum = mesAtualNum === 1 ? 12 : mesAtualNum - 1;
  const mesProximoNum = mesAtualNum === 12 ? 1 : mesAtualNum + 1;

  const [comunicados, setComunicados] = useState(isSupabaseConfigured ? [] : COMUNICADOS);
  const [erroListaComunicados, setErroListaComunicados] = useState("");
  const [erroComunicado, setErroComunicado] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoAutor, setNovoAutor] = useState("RH");
  const [novoConteudo, setNovoConteudo] = useState("");
  const [novaDataEvento, setNovaDataEvento] = useState("");

  const [aniversariantes, setAniversariantes] = useState(isSupabaseConfigured ? [] : ANIVERSARIANTES);
  const [mesAniversario, setMesAniversario] = useState(mesAtualNum);
  const [buscaAniversario, setBuscaAniversario] = useState("");

  const [buscaComunicado, setBuscaComunicado] = useState("");
  const [mesComunicado, setMesComunicado] = useState(0);
  const [periodoComunicado, setPeriodoComunicado] = useState("todos");

  const [filtroStatusFerias, setFiltroStatusFerias] = useState("todas");
  const [feriasEquipe, setFeriasEquipe] = useState(isSupabaseConfigured ? [] : FERIAS_EQUIPE);
  const [erroListaColaboradoresFerias, setErroListaColaboradoresFerias] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    listarComunicados()
      .then(setComunicados)
      .catch((err) => setErroListaComunicados(err.message || "Erro ao carregar comunicados."));
    Promise.all([listarColaboradores(), listarFerias()])
      .then(([colaboradores, ferias]) => {
        // Aniversariantes vêm direto do cadastro de colaboradores (campo "Data
        // de nascimento") — só entram quem tiver esse campo preenchido e
        // estiver com status "Ativo" (afastado/desligado não aparece no mural).
        const comDataNascimento = colaboradores
          .filter((c) => c.dataNascimento && c.status === "Ativo")
          .map((c) => ({ id: c.id, nome: c.nome, data: c.dataNascimento }));
        setAniversariantes(comDataNascimento);

        const aprovadas = ferias
          .filter((f) => f.status === "Aprovada")
          .map((f) => ({
            id: f.id,
            nome: colaboradores.find((c) => c.id === f.colaboradorId)?.nome ?? "Colaborador",
            inicio: f.dataInicio,
            fim: f.dataFim,
          }));
        setFeriasEquipe(aprovadas);
      })
      .catch((err) => setErroListaColaboradoresFerias(err.message || "Erro ao carregar colaboradores/férias."));
  }, []);

  async function publicarComunicado(e) {
    e.preventDefault();
    if (!novoTitulo.trim() || !novoConteudo.trim()) return;
    const dados = {
      titulo: novoTitulo.trim(),
      autor: novoAutor.trim() || "RH",
      data: hojeISO(),
      dataEvento: novaDataEvento || null,
      conteudo: novoConteudo.trim(),
    };
    setErroComunicado("");
    setPublicando(true);
    try {
      const novo = await criarComunicado(dados, user);
      setComunicados((atual) => [novo, ...atual]);
      setNovoTitulo("");
      setNovoAutor("RH");
      setNovoConteudo("");
      setNovaDataEvento("");
      setFormAberto(false);
    } catch (err) {
      setErroComunicado(err.message || "Erro ao publicar comunicado.");
    } finally {
      setPublicando(false);
    }
  }

  // Usado só pelo banner "Chegando" abaixo — rola pro ano seguinte quando o
  // aniversário já passou este ano, então funciona certo na virada de
  // dezembro/janeiro independente do mês selecionado no widget.
  const aniversariosProximos = useMemo(
    () => aniversariantes.map((a) => ({ ...a, prox: proximoAniversario(a.data) })),
    [aniversariantes]
  );

  const aniversariosOrdenados = useMemo(
    () =>
      aniversariantes
        .map((a) => {
          const [, mes, dia] = a.data.split("-").map(Number);
          return { ...a, mes, dia, diasAno: diasNoAno(a.data) };
        })
        .sort((a, b) => a.dia - b.dia),
    [aniversariantes]
  );

  const aniversariosFiltrados = useMemo(
    () =>
      aniversariosOrdenados.filter((a) => {
        if (a.mes !== mesAniversario) return false;
        if (buscaAniversario && !a.nome.toLowerCase().includes(buscaAniversario.toLowerCase())) return false;
        return true;
      }),
    [aniversariosOrdenados, mesAniversario, buscaAniversario]
  );

  const comunicadosFiltrados = useMemo(() => {
    const filtrados = comunicados.filter((c) => {
      const dias = diasAte(c.data);
      if (periodoComunicado === "futuros" && dias < 0) return false;
      if (periodoComunicado === "anteriores" && dias >= 0) return false;
      if (mesComunicado !== 0 && Number(c.data.split("-")[1]) !== mesComunicado) return false;
      const busca = buscaComunicado.trim().toLowerCase();
      if (busca && !`${c.titulo} ${c.conteudo}`.toLowerCase().includes(busca)) return false;
      return true;
    });
    return filtrados.sort((a, b) =>
      periodoComunicado === "futuros" ? diasAte(a.data) - diasAte(b.data) : diasAte(b.data) - diasAte(a.data)
    );
  }, [comunicados, buscaComunicado, mesComunicado, periodoComunicado]);

  const feriasOrdenadas = useMemo(
    () =>
      feriasEquipe.map((f) => ({ ...f, status: statusFerias(f.inicio, f.fim) })).sort(
        (a, b) => diasAte(a.inicio) - diasAte(b.inicio)
      ),
    [feriasEquipe]
  );

  const feriasFiltradas = feriasOrdenadas.filter((f) => {
    if (filtroStatusFerias === "andamento") return f.status === "Em andamento";
    if (filtroStatusFerias === "agendadas") return f.status === "Agendada";
    if (filtroStatusFerias === "concluidas") return f.status === "Concluída";
    return true;
  });

  const destaques = useMemo(() => {
    const itens = [];

    aniversariosProximos
      .filter((a) => a.prox.dias <= 3)
      .forEach((a) =>
        itens.push({ key: `ani-${a.id}`, dias: a.prox.dias, icon: Cake, label: `Aniversário de ${a.nome}` })
      );

    comunicados.filter((c) => c.dataEvento && diasAte(c.dataEvento) >= 0 && diasAte(c.dataEvento) <= 3).forEach((c) =>
      itens.push({ key: `com-${c.id}`, dias: diasAte(c.dataEvento), icon: CalendarClock, label: c.titulo })
    );

    feriasEquipe.filter((f) => diasAte(f.inicio) >= 0 && diasAte(f.inicio) <= 3).forEach((f) =>
      itens.push({ key: `fer-${f.id}`, dias: diasAte(f.inicio), icon: Palmtree, label: `Férias de ${f.nome} começam` })
    );

    return itens.sort((a, b) => a.dias - b.dias);
  }, [aniversariosProximos, comunicados, feriasEquipe]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Comunicação Interna</h1>
          <div className="page-subtitle">Mural, comunicados, aniversariantes e férias da equipe</div>
        </div>
      </div>

      {destaques.length > 0 && (
        <div className="destaques-banner">
          <div className="destaques-banner-title">
            <Bell size={16} /> Chegando: fique de olho nos próximos dias
          </div>
          {destaques.map((d) => (
            <div className="destaque-item" key={d.key}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <d.icon size={14} /> {d.label}
              </span>
              <span className="destaque-meta">{rotuloDias(d.dias)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-2">
        <div className="card card-pad">
          <div className="section-head">
            <div className="section-title" style={{ marginBottom: 0 }}>Mural de comunicados</div>
            {podePublicar && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => setFormAberto((v) => !v)}
              >
                <Plus size={14} /> Novo comunicado
              </button>
            )}
          </div>

          {podePublicar && (
            <div className={`collapse ${formAberto ? "open" : ""}`}>
              <div className="collapse-inner">
                <div className="collapse-content">
                  <form onSubmit={publicarComunicado} style={{ marginBottom: 18 }}>
                    <div className="form-grid">
                      <div className="field-group">
                        <label>Título</label>
                        <input
                          value={novoTitulo}
                          onChange={(e) => setNovoTitulo(e.target.value)}
                          placeholder="Ex.: Reunião geral de outubro"
                          autoFocus
                        />
                      </div>
                      <div className="field-group">
                        <label>Autor</label>
                        <input value={novoAutor} onChange={(e) => setNovoAutor(e.target.value)} placeholder="RH" />
                      </div>
                      <div className="field-group">
                        <label>Data do evento (opcional)</label>
                        <input type="date" value={novaDataEvento} onChange={(e) => setNovaDataEvento(e.target.value)} />
                      </div>
                    </div>
                    <div className="field-group">
                      <label>Conteúdo</label>
                      <textarea
                        value={novoConteudo}
                        onChange={(e) => setNovoConteudo(e.target.value)}
                        placeholder="Escreva o comunicado…"
                      />
                    </div>
                    {erroComunicado && <div className="login-error" style={{ marginBottom: 10 }}>{erroComunicado}</div>}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!novoTitulo.trim() || !novoConteudo.trim() || publicando}
                      >
                        {publicando ? "Publicando…" : "Publicar"}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setFormAberto(false)} disabled={publicando}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="filter-row">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                value={buscaComunicado}
                onChange={(e) => setBuscaComunicado(e.target.value)}
                placeholder="Buscar por título ou conteúdo…"
                aria-label="Buscar comunicado"
              />
              {buscaComunicado && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setBuscaComunicado("")}
                  aria-label="Limpar busca"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              className="select-sm"
              value={mesComunicado}
              onChange={(e) => setMesComunicado(Number(e.target.value))}
              aria-label="Filtrar comunicados por mês"
            >
              <option value={0}>Todos os meses</option>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <div className="seg-toggle">
              <button
                type="button"
                className={periodoComunicado === "futuros" ? "active" : ""}
                onClick={() => setPeriodoComunicado("futuros")}
              >
                Futuros
              </button>
              <button
                type="button"
                className={periodoComunicado === "todos" ? "active" : ""}
                onClick={() => setPeriodoComunicado("todos")}
              >
                Todos
              </button>
              <button
                type="button"
                className={periodoComunicado === "anteriores" ? "active" : ""}
                onClick={() => setPeriodoComunicado("anteriores")}
              >
                Anteriores
              </button>
            </div>
          </div>

          {erroListaComunicados && <div className="login-error" style={{ marginBottom: 14 }}>{erroListaComunicados}</div>}
          {comunicadosFiltrados.length === 0 ? (
            <div className="mural-empty">Nenhum comunicado encontrado para esse filtro.</div>
          ) : (
            comunicadosFiltrados.map((c) => (
              <div className="mural-item" key={c.id}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <h3 style={{ marginBottom: 4 }}>{c.titulo}</h3>
                  <UltimaEdicaoBadge
                    nome={c.atualizadoPor}
                    data={c.atualizadoEm}
                    tabela="rh_comunicados"
                    registroId={c.id}
                    titulo={c.titulo}
                  />
                </div>
                <div className="mural-meta">
                  {c.autor} · {formatDate(c.data)}
                  {c.dataEvento && ` · evento em ${formatDate(c.dataEvento)}`}
                </div>
                <p>{c.conteudo}</p>
              </div>
            ))
          )}
        </div>

        <div>
          <div className="card card-pad" style={{ marginBottom: 18 }}>
            <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Cake size={16} /> Aniversariantes
            </div>
            {erroListaColaboradoresFerias && (
              <div className="login-error" style={{ marginBottom: 14 }}>{erroListaColaboradoresFerias}</div>
            )}

            <div className="filter-row">
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  value={buscaAniversario}
                  onChange={(e) => setBuscaAniversario(e.target.value)}
                  placeholder="Buscar por nome…"
                  aria-label="Buscar aniversariante"
                />
                {buscaAniversario && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setBuscaAniversario("")}
                    aria-label="Limpar busca"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <select
                className="select-sm"
                value={mesAniversario}
                onChange={(e) => setMesAniversario(Number(e.target.value))}
                aria-label="Filtrar aniversariantes por mês"
              >
                {MESES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <div className="seg-toggle">
                <button
                  type="button"
                  className={mesAniversario === mesAnteriorNum ? "active" : ""}
                  onClick={() => setMesAniversario(mesAnteriorNum)}
                >
                  Anteriores
                </button>
                <button
                  type="button"
                  className={mesAniversario === mesAtualNum ? "active" : ""}
                  onClick={() => setMesAniversario(mesAtualNum)}
                >
                  Este mês
                </button>
                <button
                  type="button"
                  className={mesAniversario === mesProximoNum ? "active" : ""}
                  onClick={() => setMesAniversario(mesProximoNum)}
                >
                  Futuros
                </button>
              </div>
            </div>

            {aniversariosFiltrados.length === 0 ? (
              <div className="mural-empty">Nenhum aniversariante encontrado para esse filtro.</div>
            ) : (
              aniversariosFiltrados.map((a) => (
                <div key={a.id} className="list-row">
                  <span>{a.nome}</span>
                  <span className="list-row-meta">
                    <span style={{ color: "var(--color-text-muted)" }}>{formatDiaMes(a.data)}</span>
                    <span className={`badge ${a.diasAno < 0 ? "badge-neutral" : "badge-warning"}`}>
                      {a.diasAno < 0 ? rotuloDiasPassados(a.diasAno) : rotuloDias(a.diasAno)}
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="card card-pad">
            <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Palmtree size={16} /> Férias da equipe
            </div>
            {erroListaColaboradoresFerias && (
              <div className="login-error" style={{ marginBottom: 14 }}>{erroListaColaboradoresFerias}</div>
            )}

            <div className="seg-toggle" style={{ marginBottom: 14 }}>
              <button
                type="button"
                className={filtroStatusFerias === "andamento" ? "active" : ""}
                onClick={() => setFiltroStatusFerias("andamento")}
              >
                Em andamento
              </button>
              <button
                type="button"
                className={filtroStatusFerias === "agendadas" ? "active" : ""}
                onClick={() => setFiltroStatusFerias("agendadas")}
              >
                Agendadas
              </button>
              <button
                type="button"
                className={filtroStatusFerias === "concluidas" ? "active" : ""}
                onClick={() => setFiltroStatusFerias("concluidas")}
              >
                Concluídas
              </button>
              <button
                type="button"
                className={filtroStatusFerias === "todas" ? "active" : ""}
                onClick={() => setFiltroStatusFerias("todas")}
              >
                Todas
              </button>
            </div>

            {feriasFiltradas.length === 0 ? (
              <div className="mural-empty">Nenhum registro de férias para esse filtro.</div>
            ) : (
              feriasFiltradas.map((f) => (
                <div key={f.id} className="list-row">
                  <span>{f.nome}</span>
                  <span className="list-row-meta">
                    <span style={{ color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {formatDate(f.inicio)} a {formatDate(f.fim)}
                    </span>
                    <span className={`badge ${STATUS_FERIAS_BADGE[f.status]}`}>{f.status}</span>
                  </span>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
