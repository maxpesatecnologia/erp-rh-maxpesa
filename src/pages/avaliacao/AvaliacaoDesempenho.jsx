import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarClock, CheckCircle2, Circle, Clock, Plus, Trash2, X } from "lucide-react";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import Avatar from "../../components/Avatar";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import IniciarAvaliacaoModal from "./IniciarAvaliacaoModal";
import { useAuth } from "../../context/AuthContext";
import { isSupabaseConfigured } from "../../lib/supabaseClient";
import { listarColaboradores } from "../../lib/colaboradoresApi";
import { CICLO_ATUAL, listarAvaliacoes, criarAvaliacao, atualizarAvaliacao, excluirAvaliacao } from "../../lib/avaliacaoApi";
import {
  PESO_AUTOAVALIACAO,
  PESO_GESTOR,
  PESO_BLOCO_COMPETENCIAS,
  PESO_BLOCO_METAS,
  calcularNotaItem,
  calcularNotaBloco,
  calcularNotaFinal,
  conceitoDaNota,
  formatarNota,
} from "../../lib/avaliacaoCalculo";

const OPCOES_STATUS_PDI = ["pendente", "em_andamento", "concluido"];

function iconePdi(status) {
  if (status === "concluido") return <CheckCircle2 size={18} style={{ color: "var(--color-success)" }} />;
  if (status === "em_andamento") return <Clock size={18} style={{ color: "var(--color-warning)" }} />;
  return <Circle size={18} style={{ color: "var(--color-text-muted)" }} />;
}

function pdiAtrasado(item) {
  return item.status !== "concluido" && item.prazo && item.prazo < new Date().toISOString().slice(0, 10);
}

function statusDaAvaliacao(avaliacao) {
  if (calcularNotaFinal(avaliacao) != null) return "concluido";
  const itens = [...avaliacao.competencias, ...avaliacao.metas];
  const comAlgumaNota = itens.some((i) => i.autoavaliacao != null || i.gestor != null);
  return comAlgumaNota ? "em_andamento" : "rascunho";
}

export default function AvaliacaoDesempenho() {
  const { user } = useAuth();
  const podeGerenciar = user?.role === "admin" || user?.role === "rh";

  const [colaboradores, setColaboradores] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [selected, setSelected] = useState(null);
  const [detalheAberto, setDetalheAberto] = useState(false);

  const [edicao, setEdicao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");

  const [novaAcaoPdi, setNovaAcaoPdi] = useState("");
  const [novoPrazoPdi, setNovoPrazoPdi] = useState("");

  const [iniciarAberto, setIniciarAberto] = useState(false);
  const [salvandoIniciar, setSalvandoIniciar] = useState(false);
  const [erroIniciar, setErroIniciar] = useState("");

  const [avaliacaoParaExcluir, setAvaliacaoParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

  useEffect(() => {
    Promise.all([isSupabaseConfigured ? listarColaboradores() : Promise.resolve([]), listarAvaliacoes()])
      .then(([listaColaboradores, listaAvaliacoes]) => {
        setColaboradores(listaColaboradores);
        setAvaliacoes(listaAvaliacoes);
      })
      .catch((erro) => setErroCarregamento(erro.message))
      .finally(() => setCarregando(false));
  }, []);

  const colaboradoresVisiveis =
    user?.role === "gestor" ? colaboradores.filter((c) => c.gestor === user.nome) : colaboradores;

  const avaliacoesVisiveis = avaliacoes
    .filter((a) => colaboradoresVisiveis.some((c) => c.id === a.colaboradorId))
    .map((a) => ({ ...a, colaborador: colaboradores.find((c) => c.id === a.colaboradorId) }));

  const colaboradoresSemAvaliacao = colaboradores.filter(
    (c) => !avaliacoes.some((a) => a.colaboradorId === c.id && a.ciclo === CICLO_ATUAL)
  );

  function podeEditarAuto() {
    return podeGerenciar;
  }

  function podeEditarGestor(avaliacao) {
    return podeGerenciar || (user?.role === "gestor" && avaliacao?.colaborador?.gestor === user.nome);
  }

  function handleVerDetalhes(avaliacao) {
    if (selected?.id === avaliacao.id && detalheAberto) {
      setDetalheAberto(false);
      return;
    }
    setSelected(avaliacao);
    setEdicao({ competencias: avaliacao.competencias.map((c) => ({ ...c })), metas: avaliacao.metas.map((m) => ({ ...m })) });
    setErroEdicao("");
    setNovaAcaoPdi("");
    setNovoPrazoPdi("");
    setDetalheAberto(true);
  }

  function atualizarItemEdicao(bloco, index, campo, valor) {
    setEdicao((atual) => ({
      ...atual,
      [bloco]: atual[bloco].map((item, i) => (i === index ? { ...item, [campo]: valor === "" ? null : Number(valor) } : item)),
    }));
  }

  async function handleSalvarNotas() {
    setSalvandoEdicao(true);
    setErroEdicao("");
    try {
      const status = statusDaAvaliacao(edicao);
      const atualizada = await atualizarAvaliacao(selected.id, { competencias: edicao.competencias, metas: edicao.metas, status });
      aplicarAtualizacao(atualizada);
    } catch (erro) {
      setErroEdicao(erro.message || "Erro ao salvar as notas.");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  function aplicarAtualizacao(avaliacaoAtualizada) {
    setAvaliacoes((atual) => atual.map((a) => (a.id === avaliacaoAtualizada.id ? avaliacaoAtualizada : a)));
    setSelected((atual) => (atual && atual.id === avaliacaoAtualizada.id ? { ...atual, ...avaliacaoAtualizada } : atual));
    setEdicao({
      competencias: avaliacaoAtualizada.competencias.map((c) => ({ ...c })),
      metas: avaliacaoAtualizada.metas.map((m) => ({ ...m })),
    });
  }

  async function handleAdicionarPdi(e) {
    e.preventDefault();
    if (!novaAcaoPdi.trim() || !novoPrazoPdi) return;
    setErroEdicao("");
    try {
      const novoPdi = [...selected.pdi, { acao: novaAcaoPdi.trim(), prazo: novoPrazoPdi, status: "pendente" }];
      const atualizada = await atualizarAvaliacao(selected.id, { pdi: novoPdi });
      aplicarAtualizacao(atualizada);
      setNovaAcaoPdi("");
      setNovoPrazoPdi("");
    } catch (erro) {
      setErroEdicao(erro.message || "Erro ao adicionar ação de PDI.");
    }
  }

  async function handleStatusPdi(index, novoStatus) {
    setErroEdicao("");
    try {
      const novoPdi = selected.pdi.map((p, i) => (i === index ? { ...p, status: novoStatus } : p));
      const atualizada = await atualizarAvaliacao(selected.id, { pdi: novoPdi });
      aplicarAtualizacao(atualizada);
    } catch (erro) {
      setErroEdicao(erro.message || "Erro ao atualizar o PDI.");
    }
  }

  async function handleRemoverPdi(index) {
    setErroEdicao("");
    try {
      const novoPdi = selected.pdi.filter((_, i) => i !== index);
      const atualizada = await atualizarAvaliacao(selected.id, { pdi: novoPdi });
      aplicarAtualizacao(atualizada);
    } catch (erro) {
      setErroEdicao(erro.message || "Erro ao remover ação de PDI.");
    }
  }

  async function handleIniciarAvaliacao(dados) {
    setSalvandoIniciar(true);
    setErroIniciar("");
    try {
      const nova = await criarAvaliacao(dados);
      setAvaliacoes((atual) => [...atual, nova]);
      setIniciarAberto(false);
    } catch (erro) {
      setErroIniciar(erro.message || "Erro ao iniciar avaliação.");
    } finally {
      setSalvandoIniciar(false);
    }
  }

  function fecharModalExclusao() {
    if (excluindo) return;
    setAvaliacaoParaExcluir(null);
    setErroExclusao("");
  }

  async function confirmarExclusao() {
    const avaliacao = avaliacaoParaExcluir;
    if (!avaliacao) return;
    setExcluindo(true);
    setErroExclusao("");
    try {
      await excluirAvaliacao(avaliacao.id);
      setAvaliacoes((atual) => atual.filter((a) => a.id !== avaliacao.id));
      if (selected?.id === avaliacao.id) {
        setSelected(null);
        setDetalheAberto(false);
      }
      setAvaliacaoParaExcluir(null);
    } catch (erro) {
      setErroExclusao(erro.message || "Erro ao excluir avaliação.");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Avaliação de Desempenho</h1>
          <div className="page-subtitle">Metas, competências e plano de desenvolvimento individual (PDI) por colaborador</div>
        </div>
        {podeGerenciar && (
          <button
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            onClick={() => {
              setErroIniciar("");
              setIniciarAberto(true);
            }}
            disabled={colaboradoresSemAvaliacao.length === 0}
          >
            <Plus size={16} /> Iniciar avaliação
          </button>
        )}
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="section-title">Como a nota é calculada (proposta para validação)</div>
        <div style={{ color: "var(--color-text-muted)", fontSize: 13, lineHeight: 1.6 }}>
          Cada item (competência ou meta) recebe nota de {PESO_AUTOAVALIACAO * 100}% autoavaliação + {PESO_GESTOR * 100}% avaliação do gestor
          — o gestor tem mais peso na nota final. A nota do bloco é a média dos itens ponderada pelo peso de cada um (peso soma 100% dentro do
          bloco). A nota final do ciclo é {PESO_BLOCO_COMPETENCIAS * 100}% competências + {PESO_BLOCO_METAS * 100}% metas. A nota só fecha
          depois que o gestor avaliar todos os itens.
        </div>
      </div>

      <div className="card card-pad">
        <div className="section-title">Avaliações do ciclo</div>
        {erroCarregamento && <div className="login-error" style={{ marginBottom: 14 }}>{erroCarregamento}</div>}
        {carregando ? (
          <div className="section-hint">Carregando avaliações…</div>
        ) : (
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
              {
                key: "nota",
                label: "Nota geral",
                render: (r) => {
                  const nota = calcularNotaFinal(r);
                  if (nota == null) {
                    return <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>Aguardando gestor</span>;
                  }
                  return (
                    <span>
                      <strong>{formatarNota(nota)}</strong>{" "}
                      <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>({conceitoDaNota(nota)})</span>
                    </span>
                  );
                },
              },
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
            rows={avaliacoesVisiveis}
          />
        )}
      </div>

      {detalheAberto &&
        selected &&
        edicao &&
        createPortal(
          <div className="modal-backdrop" onClick={() => setDetalheAberto(false)}>
          <div
            className="modal-card modal-card-large"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 820 }}
            key={selected.id}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar nome={selected.colaborador?.nome} foto={selected.colaborador?.foto} size={44} />
                <div>
                  <div className="section-title" style={{ marginBottom: 0 }}>
                    {selected.colaborador?.nome} — {selected.ciclo}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                    {selected.colaborador?.cargo} · gestor: {selected.colaborador?.gestor}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {podeGerenciar && (
                  <button
                    className="btn btn-outline"
                    style={{ padding: "5px 10px", fontSize: 12, color: "var(--color-danger)" }}
                    onClick={() => {
                      setErroExclusao("");
                      setAvaliacaoParaExcluir(selected);
                    }}
                  >
                    Excluir
                  </button>
                )}
                <button className="icon-btn" aria-label="Fechar detalhes" onClick={() => setDetalheAberto(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {erroEdicao && <div className="login-error" style={{ marginBottom: 14 }}>{erroEdicao}</div>}

            <div className="grid grid-3" style={{ marginBottom: 20 }}>
              <div>
                <div className="kpi-label">Nota final</div>
                <div className="kpi-value">{formatarNota(calcularNotaFinal(selected))}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{conceitoDaNota(calcularNotaFinal(selected)) ?? "Ciclo em andamento"}</div>
              </div>
              <div>
                <div className="kpi-label">Bloco competências ({PESO_BLOCO_COMPETENCIAS * 100}%)</div>
                <div className="kpi-value">{formatarNota(calcularNotaBloco(selected.competencias))}</div>
              </div>
              <div>
                <div className="kpi-label">Bloco metas ({PESO_BLOCO_METAS * 100}%)</div>
                <div className="kpi-value">{formatarNota(calcularNotaBloco(selected.metas))}</div>
              </div>
            </div>

            <div>
              <div>
                <div className="kpi-label" style={{ marginBottom: 8 }}>Competências</div>
                <DataTable
                  columns={[
                    { key: "nome", label: "Competência" },
                    { key: "peso", label: "Peso", render: (i) => `${i.peso}%` },
                    {
                      key: "autoavaliacao",
                      label: "Auto",
                      render: (i, index) =>
                        podeEditarAuto() ? (
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={edicao.competencias[index]?.autoavaliacao ?? ""}
                            onChange={(e) => atualizarItemEdicao("competencias", index, "autoavaliacao", e.target.value)}
                            style={{ width: 56 }}
                          />
                        ) : (
                          i.autoavaliacao ?? "—"
                        ),
                    },
                    {
                      key: "gestor",
                      label: "Gestor",
                      render: (i, index) =>
                        podeEditarGestor(selected) ? (
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={edicao.competencias[index]?.gestor ?? ""}
                            onChange={(e) => atualizarItemEdicao("competencias", index, "gestor", e.target.value)}
                            style={{ width: 56 }}
                          />
                        ) : (
                          i.gestor ?? "—"
                        ),
                    },
                    { key: "notaPonderada", label: "Nota", render: (i) => formatarNota(calcularNotaItem(i)) },
                  ]}
                  rows={edicao.competencias}
                  rowKey="nome"
                />
              </div>
              <div style={{ marginTop: 20 }}>
                <div className="kpi-label" style={{ marginBottom: 8 }}>Metas do ciclo</div>
                <DataTable
                  columns={[
                    { key: "descricao", label: "Meta" },
                    { key: "percentualAtingido", label: "Atingido", render: (m) => `${m.percentualAtingido}%` },
                    {
                      key: "autoavaliacao",
                      label: "Auto",
                      render: (m, index) =>
                        podeEditarAuto() ? (
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={edicao.metas[index]?.autoavaliacao ?? ""}
                            onChange={(e) => atualizarItemEdicao("metas", index, "autoavaliacao", e.target.value)}
                            style={{ width: 56 }}
                          />
                        ) : (
                          m.autoavaliacao ?? "—"
                        ),
                    },
                    {
                      key: "gestor",
                      label: "Gestor",
                      render: (m, index) =>
                        podeEditarGestor(selected) ? (
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={edicao.metas[index]?.gestor ?? ""}
                            onChange={(e) => atualizarItemEdicao("metas", index, "gestor", e.target.value)}
                            style={{ width: 56 }}
                          />
                        ) : (
                          m.gestor ?? "—"
                        ),
                    },
                    { key: "status", label: "Status", render: (m) => <StatusBadge status={m.status} /> },
                  ]}
                  rows={edicao.metas}
                  rowKey="descricao"
                />
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div className="kpi-label" style={{ marginBottom: 0 }}>Plano de Desenvolvimento (PDI)</div>
                {selected.pdi.length > 0 && (
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                    {selected.pdi.filter((p) => p.status === "concluido").length}/{selected.pdi.length} concluídas
                  </span>
                )}
              </div>

              {selected.pdi.length === 0 ? (
                <div style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 10 }}>Nenhuma ação de PDI registrada neste ciclo.</div>
              ) : (
                <>
                  <div className="admissao-progress-bar" style={{ marginBottom: 12 }}>
                    <div
                      className="admissao-progress-fill"
                      style={{ width: `${Math.round((selected.pdi.filter((p) => p.status === "concluido").length / selected.pdi.length) * 100)}%` }}
                    />
                  </div>
                  <div className="pdi-list">
                    {selected.pdi.map((p, index) => (
                      <div className="pdi-item" key={`${p.acao}-${p.prazo}`}>
                        <span className="pdi-item-icon">{iconePdi(p.status)}</span>
                        <div className="pdi-item-body">
                          <div className="pdi-item-acao">{p.acao}</div>
                          <div className={`pdi-item-prazo ${pdiAtrasado(p) ? "atrasado" : ""}`}>
                            <CalendarClock size={13} /> prazo {p.prazo}
                            {pdiAtrasado(p) ? " · atrasado" : ""}
                          </div>
                        </div>
                        {podeEditarGestor(selected) ? (
                          <>
                            <select value={p.status} onChange={(e) => handleStatusPdi(index, e.target.value)} style={{ fontSize: 12 }}>
                              {OPCOES_STATUS_PDI.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="icon-btn"
                              aria-label="Remover ação"
                              onClick={() => handleRemoverPdi(index)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <StatusBadge status={p.status} />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {podeEditarGestor(selected) && (
                <form onSubmit={handleAdicionarPdi} style={{ display: "flex", gap: 8 }}>
                  <input
                    value={novaAcaoPdi}
                    onChange={(e) => setNovaAcaoPdi(e.target.value)}
                    placeholder="Nova ação de PDI"
                    style={{ flex: 1 }}
                  />
                  <input type="date" value={novoPrazoPdi} onChange={(e) => setNovoPrazoPdi(e.target.value)} />
                  <button
                    type="submit"
                    className="btn btn-outline"
                    style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </form>
              )}
            </div>

            {(podeEditarAuto() || podeEditarGestor(selected)) && (
              <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={handleSalvarNotas} disabled={salvandoEdicao}>
                  {salvandoEdicao ? "Salvando…" : "Salvar notas"}
                </button>
              </div>
            )}
          </div>
          </div>,
          document.body
        )}

      {iniciarAberto && (
        <IniciarAvaliacaoModal
          colaboradores={colaboradoresSemAvaliacao}
          onFechar={() => setIniciarAberto(false)}
          onConfirmar={handleIniciarAvaliacao}
          salvando={salvandoIniciar}
          erro={erroIniciar}
        />
      )}

      {avaliacaoParaExcluir && (
        <ConfirmDeleteModal
          titulo="Excluir avaliação"
          mensagem={`Tem certeza que deseja excluir a avaliação de "${avaliacaoParaExcluir.colaborador?.nome}" (${avaliacaoParaExcluir.ciclo})? Essa ação não pode ser desfeita.`}
          confirmando={excluindo}
          erro={erroExclusao}
          onConfirmar={confirmarExclusao}
          onCancelar={fecharModalExclusao}
        />
      )}
    </div>
  );
}
