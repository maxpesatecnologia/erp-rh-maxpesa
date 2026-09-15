import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { OPCOES_ORIGEM } from "./origens";

export default function CandidatoModal({ candidato, onFechar, onSalvar, onExcluir, salvando = false, erro = "" }) {
  const origemInicialEhPreset = OPCOES_ORIGEM.includes(candidato.origem);
  const [nome, setNome] = useState(candidato.nome || "");
  const [vaga, setVaga] = useState(candidato.vaga || "");
  const [origemSelecionada, setOrigemSelecionada] = useState(
    origemInicialEhPreset ? candidato.origem : candidato.origem ? "Outra" : ""
  );
  const [origemCustom, setOrigemCustom] = useState(origemInicialEhPreset ? "" : candidato.origem || "");
  const [faseAtual, setFaseAtual] = useState(candidato.faseAtual || "");

  function handleSubmit(e) {
    e.preventDefault();
    const nomeTratado = nome.trim();
    if (!nomeTratado) return;
    const origem = origemSelecionada === "Outra" ? origemCustom.trim() : origemSelecionada;
    onSalvar({
      nome: nomeTratado,
      vaga: vaga.trim(),
      origem,
      faseAtual: faseAtual.trim(),
    });
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card modal-card-large" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Detalhes do candidato</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

          <div className="field-group">
            <label>Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do candidato" autoFocus />
          </div>

          <div className="field-group">
            <label>Vaga</label>
            <input
              value={vaga}
              onChange={(e) => setVaga(e.target.value)}
              placeholder="Ex.: Mecânico de Equipamentos Pesados"
            />
          </div>

          <div className="field-group">
            <label>Origem</label>
            <select value={origemSelecionada} onChange={(e) => setOrigemSelecionada(e.target.value)}>
              <option value="">Selecione…</option>
              {OPCOES_ORIGEM.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
              <option value="Outra">Outra…</option>
            </select>
          </div>

          {origemSelecionada === "Outra" && (
            <div className="field-group">
              <label>Qual origem?</label>
              <input
                value={origemCustom}
                onChange={(e) => setOrigemCustom(e.target.value)}
                placeholder="Ex.: indicação, feira de empregos…"
              />
            </div>
          )}

          <div className="field-group">
            <label>Fase atual</label>
            <textarea
              rows={3}
              value={faseAtual}
              onChange={(e) => setFaseAtual(e.target.value)}
              placeholder="Ex.: Fase atual: exame admissional agendado para 20/09"
            />
          </div>

          <div className="modal-actions" style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => onExcluir(candidato)}
              disabled={salvando}
            >
              <Trash2 size={14} /> Excluir candidato
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn btn-outline" onClick={onFechar} disabled={salvando}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={!nome.trim() || salvando}>
                {salvando ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
