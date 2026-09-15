import { useState } from "react";
import { X } from "lucide-react";

const TIPOS = ["NR", "Técnico", "Certificação", "Integração"];

export default function NovoTreinamentoModal({ onFechar, onConfirmar }) {
  const [colaborador, setColaborador] = useState("");
  const [curso, setCurso] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [conclusao, setConclusao] = useState("");
  const [validade, setValidade] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onConfirmar({
      colaborador: colaborador.trim(),
      curso: curso.trim(),
      tipo,
      cargaHoraria: Number(cargaHoraria) || 0,
      conclusao,
      validade: validade || null,
    });
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>Novo treinamento</h3>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label>Colaborador</label>
            <input value={colaborador} onChange={(e) => setColaborador(e.target.value)} placeholder="Nome do colaborador" required />
          </div>

          <div className="field-group">
            <label>Curso</label>
            <input value={curso} onChange={(e) => setCurso(e.target.value)} placeholder="Ex.: NR-35 — Trabalho em Altura" required />
          </div>

          <div className="grid grid-2">
            <div className="field-group">
              <label>Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label>Carga horária (h)</label>
              <input type="number" min={1} value={cargaHoraria} onChange={(e) => setCargaHoraria(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="field-group">
              <label>Conclusão</label>
              <input type="date" value={conclusao} onChange={(e) => setConclusao(e.target.value)} required />
            </div>
            <div className="field-group">
              <label>Validade (opcional)</label>
              <input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Registrar treinamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
