import { useEffect, useMemo, useState } from "react";
import { Plus, Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import DataTable from "../../components/DataTable";
import UltimaEdicaoBadge from "../../components/UltimaEdicaoBadge";
import { useAuth } from "../../context/AuthContext";
import {
  EQUIPES,
  INDICADORES_EQUIPE,
  notaGeralDaAvaliacao,
  listarAvaliacoesEquipe,
  criarAvaliacaoEquipe,
} from "../../lib/avaliacaoEquipeApi";

const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function periodoAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatPeriodo(periodo) {
  if (!periodo) return "—";
  const [ano, mes] = periodo.split("-");
  return `${MESES_ABREV[Number(mes) - 1]}/${ano}`;
}

function indicadoresIniciais() {
  return Object.fromEntries(INDICADORES_EQUIPE.map((i) => [i.key, 3]));
}

function EstrelaInput({ value, onChange, max = 5 }) {
  return (
    <div className="operador-stars" role="radiogroup">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} de ${max}`}
          style={{ background: "none", border: "none", padding: 2, cursor: "pointer", lineHeight: 0 }}
        >
          <Star size={18} className={n <= value ? "star-filled" : "star-empty"} />
        </button>
      ))}
    </div>
  );
}

function EstrelasView({ value, max = 5, size = 14 }) {
  if (value == null) return <span style={{ color: "var(--color-text-muted)" }}>—</span>;
  const arredondado = Math.round(value);
  return (
    <span className="operador-stars" style={{ display: "inline-flex" }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <Star key={n} size={size} className={n <= arredondado ? "star-filled" : "star-empty"} />
      ))}
    </span>
  );
}

function Tendencia({ atual, anterior }) {
  if (atual == null || anterior == null) return null;
  const diff = atual - anterior;
  const texto = `${diff > 0 ? "+" : ""}${diff.toFixed(1)} vs. período anterior`;
  if (Math.abs(diff) < 0.05) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
        <Minus size={13} /> estável vs. período anterior
      </span>
    );
  }
  const cor = diff > 0 ? "var(--color-success)" : "var(--color-danger)";
  const Icone = diff > 0 ? TrendingUp : TrendingDown;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: cor }}>
      <Icone size={13} /> {texto}
    </span>
  );
}

export default function AvaliacaoEquipes() {
  const { user } = useAuth();

  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [equipeFormAberto, setEquipeFormAberto] = useState(null);
  const [periodo, setPeriodo] = useState(periodoAtual());
  const [indicadores, setIndicadores] = useState(indicadoresIniciais());
  const [pontosAtencao, setPontosAtencao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState("");

  useEffect(() => {
    listarAvaliacoesEquipe()
      .then(setAvaliacoes)
      .catch((erro) => setErroCarregamento(erro.message))
      .finally(() => setCarregando(false));
  }, []);

  const porEquipe = useMemo(() => {
    const mapa = new Map(EQUIPES.map((e) => [e, []]));
    avaliacoes.forEach((a) => {
      if (!mapa.has(a.equipe)) mapa.set(a.equipe, []);
      mapa.get(a.equipe).push(a);
    });
    mapa.forEach((lista) => lista.sort((a, b) => (a.periodo < b.periodo ? 1 : -1)));
    return mapa;
  }, [avaliacoes]);

  function abrirForm(equipe) {
    setEquipeFormAberto((atual) => (atual === equipe ? null : equipe));
    setPeriodo(periodoAtual());
    setIndicadores(indicadoresIniciais());
    setPontosAtencao("");
    setObservacoes("");
    setErroForm("");
  }

  async function handleRegistrar(e, equipe) {
    e.preventDefault();
    setSalvando(true);
    setErroForm("");
    try {
      const nova = await criarAvaliacaoEquipe(
        {
          equipe,
          periodo,
          indicadores,
          pontosAtencao,
          observacoes,
          gestorResponsavel: user?.nome || "—",
        },
        user
      );
      setAvaliacoes((atual) => [nova, ...atual]);
      setEquipeFormAberto(null);
    } catch (erro) {
      setErroForm(erro.message || "Erro ao registrar avaliação.");
    } finally {
      setSalvando(false);
    }
  }

  const comparativo = EQUIPES.map((equipe) => {
    const historico = porEquipe.get(equipe) || [];
    const ultima = historico[0];
    return {
      equipe,
      periodo: ultima ? formatPeriodo(ultima.periodo) : "—",
      nota: ultima ? notaGeralDaAvaliacao(ultima.indicadores) : null,
      gestor: ultima?.gestorResponsavel ?? "—",
    };
  });

  return (
    <div>
      <div className="page-subtitle" style={{ marginBottom: 20 }}>
        Cada gestor registra, por período, como está o próprio time. Fica salvo um histórico por equipe para
        acompanhar a evolução e comparar a opinião entre times.
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="section-title">Comparativo entre equipes</div>
        {carregando ? (
          <div className="section-hint">Carregando avaliações…</div>
        ) : (
          <DataTable
            columns={[
              { key: "equipe", label: "Equipe" },
              { key: "periodo", label: "Última avaliação" },
              { key: "gestor", label: "Gestor responsável" },
              { key: "nota", label: "Nota geral", render: (r) => <EstrelasView value={r.nota} /> },
            ]}
            rows={comparativo}
            rowKey="equipe"
          />
        )}
      </div>

      {erroCarregamento && <div className="login-error" style={{ marginBottom: 14 }}>{erroCarregamento}</div>}

      {EQUIPES.map((equipe) => {
        const historico = porEquipe.get(equipe) || [];
        const ultima = historico[0];
        const anterior = historico[1];
        const notaUltima = ultima ? notaGeralDaAvaliacao(ultima.indicadores) : null;
        const notaAnterior = anterior ? notaGeralDaAvaliacao(anterior.indicadores) : null;

        return (
          <div className="card card-pad" key={equipe} style={{ marginBottom: 20 }}>
            <div className="section-head">
              <div className="section-title" style={{ marginBottom: 0 }}>{equipe}</div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => abrirForm(equipe)}
              >
                <Plus size={14} /> Registrar avaliação
              </button>
            </div>

            {ultima ? (
              <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginBottom: 14 }}>
                <div>
                  <div className="kpi-label" style={{ marginBottom: 4 }}>Nota geral · {formatPeriodo(ultima.periodo)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <EstrelasView value={notaUltima} size={18} />
                    <strong>{notaUltima != null ? notaUltima.toFixed(1) : "—"}</strong>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Gestor: {ultima.gestorResponsavel}</div>
                <Tendencia atual={notaUltima} anterior={notaAnterior} />
              </div>
            ) : (
              <div className="section-hint" style={{ marginBottom: 14 }}>Nenhuma avaliação registrada ainda.</div>
            )}

            <div className={`collapse ${equipeFormAberto === equipe ? "open" : ""}`}>
              <div className="collapse-inner">
                <div className="collapse-content">
                  <form onSubmit={(e) => handleRegistrar(e, equipe)}>
                    {erroForm && <div className="login-error" style={{ marginBottom: 14 }}>{erroForm}</div>}
                    <div className="form-grid">
                      <div className="field-group">
                        <label>Período de referência</label>
                        <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required />
                      </div>
                      <div className="field-group">
                        <label>Gestor responsável</label>
                        <input value={user?.nome || ""} disabled />
                      </div>
                    </div>

                    <div className="grid grid-2" style={{ marginBottom: 14 }}>
                      {INDICADORES_EQUIPE.map((ind) => (
                        <div key={ind.key}>
                          <div className="kpi-label" style={{ marginBottom: 6 }}>{ind.label}</div>
                          <EstrelaInput
                            value={indicadores[ind.key]}
                            onChange={(v) => setIndicadores((atual) => ({ ...atual, [ind.key]: v }))}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="field-group">
                      <label>Pontos de atenção (opcional)</label>
                      <textarea
                        value={pontosAtencao}
                        onChange={(e) => setPontosAtencao(e.target.value)}
                        placeholder="Riscos, pendências ou problemas que o RH precisa saber…"
                      />
                    </div>
                    <div className="field-group">
                      <label>Como está a equipe — resumo para o RH</label>
                      <textarea
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Resumo geral do período…"
                        required
                      />
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button type="submit" className="btn btn-primary" disabled={salvando}>
                        {salvando ? "Salvando…" : "Salvar avaliação"}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setEquipeFormAberto(null)}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {historico.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="kpi-label" style={{ marginBottom: 8 }}>Histórico</div>
                <DataTable
                  columns={[
                    { key: "periodo", label: "Período", render: (r) => formatPeriodo(r.periodo) },
                    { key: "gestor", label: "Gestor", render: (r) => r.gestorResponsavel },
                    {
                      key: "nota",
                      label: "Nota geral",
                      render: (r) => <EstrelasView value={notaGeralDaAvaliacao(r.indicadores)} />,
                    },
                    { key: "pontosAtencao", label: "Pontos de atenção", render: (r) => r.pontosAtencao || "—" },
                    { key: "observacoes", label: "Observações", render: (r) => r.observacoes || "—" },
                    {
                      key: "ultimaEdicao",
                      label: "Última edição",
                      render: (r) => (
                        <UltimaEdicaoBadge
                          nome={r.atualizadoPor}
                          data={r.atualizadoEm}
                          tabela="rh_avaliacoes_equipe"
                          registroId={r.id}
                          titulo={r.equipe}
                        />
                      ),
                    },
                  ]}
                  rows={historico}
                  rowKey="id"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
