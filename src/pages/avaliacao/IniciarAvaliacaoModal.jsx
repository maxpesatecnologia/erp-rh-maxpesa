import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { CICLO_ATUAL, COMPETENCIAS_PADRAO } from "../../lib/avaliacaoApi";
import SearchableSelect from "../../components/SearchableSelect";

export default function IniciarAvaliacaoModal({ colaboradores, onFechar, onConfirmar, salvando = false, erro = "" }) {
  const [colaboradorId, setColaboradorId] = useState(colaboradores[0]?.id ?? "");
  const [metas, setMetas] = useState([{ descricao: "", peso: 100 }]);

  const pesoTotal = metas.reduce((soma, m) => soma + (Number(m.peso) || 0), 0);
  const metasValidas = metas.every((m) => m.descricao.trim()) && pesoTotal === 100;

  function atualizarMeta(index, campo, valor) {
    setMetas((atual) => atual.map((m, i) => (i === index ? { ...m, [campo]: valor } : m)));
  }

  function adicionarMeta() {
    setMetas((atual) => [...atual, { descricao: "", peso: 0 }]);
  }

  function removerMeta(index) {
    setMetas((atual) => atual.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onConfirmar({
      colaboradorId,
      ciclo: CICLO_ATUAL,
      competencias: COMPETENCIAS_PADRAO.map((c) => ({ ...c, autoavaliacao: null, gestor: null })),
      metas: metas.map((m) => ({
        descricao: m.descricao.trim(),
        peso: Number(m.peso) || 0,
        percentualAtingido: 0,
        autoavaliacao: null,
        gestor: null,
        status: "pendente",
      })),
    });
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Iniciar avaliação de desempenho</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <p className="section-hint" style={{ marginTop: 0 }}>
          Abre o ciclo <strong>{CICLO_ATUAL}</strong> para o colaborador, com as competências padrão. As metas do
          ciclo são definidas agora (o peso de todas precisa somar 100%).
        </p>

        <form onSubmit={handleSubmit}>
          {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

          <div className="field-group">
            <label>Colaborador</label>
            <SearchableSelect
              options={colaboradores.map((c) => ({ value: c.id, label: `${c.nome} — ${c.cargo}` }))}
              value={colaboradorId}
              onChange={setColaboradorId}
              placeholder="Selecione um colaborador"
              searchPlaceholder="Buscar colaborador…"
            />
          </div>

          <div className="field-group">
            <label>Metas do ciclo (peso total: {pesoTotal}%)</label>
            {metas.map((meta, index) => (
              <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  value={meta.descricao}
                  onChange={(e) => atualizarMeta(index, "descricao", e.target.value)}
                  placeholder="Descrição da meta"
                  style={{ flex: 1 }}
                  required
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={meta.peso}
                  onChange={(e) => atualizarMeta(index, "peso", e.target.value)}
                  style={{ width: 80 }}
                  required
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Remover meta"
                  onClick={() => removerMeta(index)}
                  disabled={metas.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", fontSize: 12 }}
              onClick={adicionarMeta}
            >
              <Plus size={14} /> Adicionar meta
            </button>
            {pesoTotal !== 100 && (
              <div style={{ color: "var(--color-danger)", fontSize: 12, marginTop: 6 }}>
                O peso das metas precisa somar 100% (hoje soma {pesoTotal}%).
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={!colaboradorId || !metasValidas || salvando}>
              {salvando ? "Criando…" : "Iniciar avaliação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
